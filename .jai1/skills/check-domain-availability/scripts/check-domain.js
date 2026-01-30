#!/usr/bin/env node

/**
 * Script to check domain availability using RDAP (with IANA bootstrap) and WHOIS as fallback.
 * Supports: jp, co.jp, com, net, ai, io, and others.
 * 
 * Usage: node check-domain.js <domain1> <domain2> ...
 */

const https = require('https');
const { exec } = require('child_process');
const dns = require('dns');

const DOMAINS = process.argv.slice(2);

if (DOMAINS.length === 0) {
    console.log("Usage: node check-domain.js <domain1> [domain2] ...");
    process.exit(1);
}

// Configuration for specific TLDs
const TLD_CONFIG = {
    // Specific RDAP servers
    'com': { method: 'rdap', url: 'https://rdap.verisign.com/com/v1/domain/' },
    'net': { method: 'rdap', url: 'https://rdap.verisign.com/net/v1/domain/' },
    'io': { method: 'rdap', url: 'https://rdap.nic.io/domain/' },
    'org': { method: 'rdap', url: 'https://rdap.publicinterestregistry.net/rdap/org/domain/' },

    // Use WHOIS for these as it's more reliable/easier than finding their specific RDAP quirks
    'jp': { method: 'whois' },
    'co.jp': { method: 'whois' },
    'ai': { method: 'whois' },
    'ca': { method: 'whois' },
    'uk': { method: 'whois' },
    'co.uk': { method: 'whois' },

    // Default fallback
    'default': { method: 'whois' }
};

// Map simple TLDs to RDAP if we want to try generic IANA bootstrap (not used directly now to avoid false positives)

function createRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: { 'User-Agent': 'DomainCheckTool/1.0', 'Accept': 'application/rdap+json' }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                createRequest(res.headers.location).then(resolve).catch(reject);
                return;
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
        });

        req.on('timeout', () => { req.abort(); reject(new Error('Timeout')); });
        req.on('error', reject);
    });
}

function getTld(domain) {
    const parts = domain.split('.');
    // Special handling for co.jp, etc.
    if (parts.length > 2) {
        const secondToLast = parts[parts.length - 2];
        if (['co', 'ne', 'or', 'go', 'ac'].includes(secondToLast)) {
            return parts.slice(-2).join('.');
        }
    }
    return parts[parts.length - 1];
}

async function checkRdap(domain, baseUrl) {
    // Ensure baseUrl ends with /
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    const url = baseUrl + domain;

    try {
        const response = await createRequest(url);

        if (response.statusCode === 200) {
            try {
                const json = JSON.parse(response.data);
                // IF JSON parses and has a handle or status, it exists
                if (json.handle || (json.events && json.events.length > 0)) {
                    return { status: 'TAKEN', method: 'RDAP' };
                }
            } catch (e) {
                // If 200 but not valid JSON, assume Taken? Or error?
                // RDAP usually returns JSON.
                return { status: 'TAKEN', method: 'RDAP (Non-JSON 200)' };
            }
            return { status: 'TAKEN', method: 'RDAP' };
        } else if (response.statusCode === 404) {
            return { status: 'AVAILABLE', method: 'RDAP' };
        } else {
            return { status: 'UNKNOWN', method: 'RDAP', error: `HTTP ${response.statusCode}` };
        }

    } catch (error) {
        return { status: 'UNKNOWN', method: 'RDAP', error: error.message };
    }
}

function checkWhois(domain) {
    return new Promise((resolve) => {
        exec(`whois ${domain}`, { timeout: 10000 }, (error, stdout, stderr) => {
            if (error && error.code !== 1) { // code 1 can sometimes happen on "not found" in some whois clients?
                // proceed to parse stdout anyway
            }

            const output = stdout.toLowerCase();

            // Heuristics for "Available"
            const availablePatterns = [
                "no match",
                "not found",
                "no object found",
                "domain not found",
                "is free",
                "status: free",
                "no data found",
                "no entries found"
            ];

            const takenPatterns = [
                "expiration date",
                "creation date",
                "registry expiry date",
                "domain name:",
                "domain name :",
                "status: active",
                "status: ok",
                // JP and other formats
                "[domain name]",
                "[created on]",
                "[expires on]",
                "[status]",
                "[登録年月日]",
                "[有効期限]",
                "domain:", // simple "Domain: example.com"
                "nserver:" // often shows nameservers if taken
            ];

            if ([...availablePatterns].some(p => output.includes(p))) {
                resolve({ status: 'AVAILABLE', method: 'WHOIS' });
            } else if ([...takenPatterns].some(p => output.includes(p))) {
                resolve({ status: 'TAKEN', method: 'WHOIS' });
            } else {
                resolve({ status: 'UNKNOWN', method: 'WHOIS', error: "Unrecognized WHOIS output" });
            }
        });
    });
}

async function checkDomain(domain) {
    const tld = getTld(domain);
    const config = TLD_CONFIG[tld] || TLD_CONFIG['default'];

    let result;

    if (config.method === 'rdap' && config.url) {
        result = await checkRdap(domain, config.url);
        // If RDAP fails (UNKNOWN), try WHOIS fallback
        if (result.status === 'UNKNOWN' || result.status === 'ERROR') {
            result = await checkWhois(domain);
        }
    } else {
        result = await checkWhois(domain);
    }

    return result;
}

(async () => {
    // Print Header
    console.log(String("DOMAIN").padEnd(35) + String("STATUS").padEnd(15) + "METHOD");
    console.log("-".repeat(60));

    for (const domain of DOMAINS) {
        try {
            const result = await checkDomain(domain);

            let statusColor = "";
            let resetColor = "";
            if (process.stdout.isTTY) {
                if (result.status === 'AVAILABLE') statusColor = "\x1b[32m";
                else if (result.status === 'TAKEN') statusColor = "\x1b[31m";
                else statusColor = "\x1b[33m";
                resetColor = "\x1b[0m";
            }

            console.log(
                domain.padEnd(35) +
                statusColor + result.status.padEnd(15) + resetColor +
                "(" + result.method + ")"
            );
        } catch (err) {
            console.log(domain.padEnd(35) + "ERROR          " + err.message);
        }
    }
})();
