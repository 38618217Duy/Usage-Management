# Flutter / Dart Style Guide - Security & High-Impact Focus

## Review Priority

> ⚠️ **For teams without dedicated reviewers**: This guide focuses on **security vulnerabilities, critical bugs, and high-impact issues** only. Minor style issues should be ignored.

### Critical (Must Fix)
1. **Security vulnerabilities** - Data exposure, insecure storage, MITM attacks
2. **Data leaks** - Sensitive data in logs, shared preferences, or insecure APIs
3. **Critical bugs** - Crashes, data loss, infinite loops
4. **Platform security** - Hardcoded secrets, insecure permissions

### High (Should Fix)
1. **Memory issues** - Leaks, excessive allocations
2. **State management bugs** - Race conditions, stale data
3. **Error handling** - Unhandled exceptions, poor UX on errors
4. **Performance** - Janky UI, slow operations on main thread

### Ignore
- Code formatting and style
- Naming preferences
- Widget organization preferences
- Minor refactoring suggestions

---

## Security Checklist

### Secure Storage
```dart
// ❌ CRITICAL: Storing sensitive data in SharedPreferences
final prefs = await SharedPreferences.getInstance();
await prefs.setString('auth_token', token);
await prefs.setString('password', password);
await prefs.setString('credit_card', cardNumber);

// ✅ Use flutter_secure_storage for sensitive data
final secureStorage = const FlutterSecureStorage();
await secureStorage.write(key: 'auth_token', value: token);

// ❌ CRITICAL: Storing secrets in code
const apiKey = 'sk-live-xxx123';
const dbPassword = 'secret123';

// ✅ Use dart-define for secrets (injected at build time)
const apiKey = String.fromEnvironment('API_KEY');
// Build: flutter build --dart-define=API_KEY=xxx

// ✅ Or use a secure backend to manage secrets
```

### Network Security
```dart
// ❌ CRITICAL: Disabling certificate verification
HttpClient()..badCertificateCallback = (cert, host, port) => true;

// ✅ Never disable in production
// Only allow in debug mode if absolutely necessary
assert(() {
  // Debug-only code
  return true;
}());

// ❌ CRITICAL: Sending sensitive data over HTTP
final response = await http.post(
  Uri.parse('http://api.example.com/login'), // Not HTTPS!
  body: {'password': password},
);

// ✅ Always use HTTPS
final response = await http.post(
  Uri.parse('https://api.example.com/login'),
  body: {'password': password},
);

// ✅ Pin certificates for high-security apps
```

### Authentication & Token Handling
```dart
// ❌ CRITICAL: Logging sensitive data
print('User logged in with token: $token');
debugPrint('Password: $password');

// ✅ Never log sensitive data
print('User logged in: ${user.id}');

// ❌ CRITICAL: Tokens in URLs (logged in server access logs)
final response = await http.get(
  Uri.parse('https://api.example.com/data?token=$token'),
);

// ✅ Tokens in headers
final response = await http.get(
  Uri.parse('https://api.example.com/data'),
  headers: {'Authorization': 'Bearer $token'},
);

// ❌ CRITICAL: Not validating/refreshing expired tokens
final response = await http.get(uri, headers: headers);
// Token might be expired!

// ✅ Handle token expiration
Future<Response> authenticatedRequest(Uri uri) async {
  final token = await secureStorage.read(key: 'auth_token');
  
  if (token == null || isTokenExpired(token)) {
    await refreshToken();
  }
  
  return http.get(uri, headers: {
    'Authorization': 'Bearer ${await secureStorage.read(key: 'auth_token')}',
  });
}
```

### Input Validation
```dart
// ❌ CRITICAL: No input validation
TextFormField(
  controller: _emailController,
  onSubmitted: (value) => submitEmail(value),
);

// ✅ Validate user input
TextFormField(
  controller: _emailController,
  validator: (value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Enter a valid email';
    }
    return null;
  },
);

// ✅ Also validate on server side!
```

### Deep Link Security
```dart
// ❌ CRITICAL: No validation of deep links
void handleDeepLink(Uri uri) {
  if (uri.path == '/reset-password') {
    resetPassword(uri.queryParameters['token']!);
  }
}

// ✅ Validate deep link parameters
void handleDeepLink(Uri uri) {
  if (uri.path == '/reset-password') {
    final token = uri.queryParameters['token'];
    
    if (token == null || token.length != 64) {
      // Invalid token format
      return;
    }
    
    // Verify token with backend before proceeding
    verifyResetToken(token).then((valid) {
      if (valid) {
        navigateToResetPassword(token);
      }
    });
  }
}
```

### Platform Permissions
```dart
// ❌ CRITICAL: Requesting unnecessary permissions
// Don't request camera permission if you only need gallery

// ✅ Request only needed permissions with explanation
Future<void> requestCameraPermission() async {
  final status = await Permission.camera.status;
  
  if (status.isDenied) {
    // Show rationale before requesting
    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Camera Access'),
        content: const Text(
          'We need camera access to take photos for your profile.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Permission.camera.request();
            },
            child: const Text('Allow'),
          ),
        ],
      ),
    );
  }
}
```

---

## High-Impact Issues

### Memory Leaks
```dart
// ❌ HIGH IMPACT: Not disposing controllers
class _MyWidgetState extends State<MyWidget> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  StreamSubscription? _subscription;
  
  @override
  void initState() {
    super.initState();
    _subscription = stream.listen((data) {});
  }
  
  // Missing dispose!
}

// ✅ Always dispose controllers and subscriptions
class _MyWidgetState extends State<MyWidget> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  StreamSubscription? _subscription;
  
  @override
  void initState() {
    super.initState();
    _subscription = stream.listen((data) {});
  }
  
  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    _subscription?.cancel();
    super.dispose();
  }
}

// ❌ HIGH IMPACT: Holding references to BuildContext across async gaps
void _loadData() async {
  final data = await api.fetchData();
  Navigator.of(context).push(...); // Context might be invalid!
}

// ✅ Check if mounted before using context
void _loadData() async {
  final data = await api.fetchData();
  if (!mounted) return;
  Navigator.of(context).push(...);
}
```

### Blocking the Main Thread
```dart
// ❌ HIGH IMPACT: Heavy computation on main thread
void _processData() {
  final result = heavyComputation(largeData); // UI freezes!
  setState(() => _data = result);
}

// ✅ Use isolates for heavy computation
void _processData() async {
  final result = await compute(heavyComputation, largeData);
  setState(() => _data = result);
}

// ❌ HIGH IMPACT: Parsing large JSON on main thread
Future<List<User>> getUsers() async {
  final response = await http.get(uri);
  return jsonDecode(response.body); // Blocks UI for large responses
}

// ✅ Parse in isolate
Future<List<User>> getUsers() async {
  final response = await http.get(uri);
  return compute(_parseUsers, response.body);
}

List<User> _parseUsers(String body) {
  final json = jsonDecode(body) as List;
  return json.map((e) => User.fromJson(e)).toList();
}
```

### Error Handling
```dart
// ❌ HIGH IMPACT: Swallowing errors
try {
  await api.submitData(data);
} catch (e) {
  // Silent failure - user doesn't know it failed!
}

// ✅ Handle and communicate errors
try {
  await api.submitData(data);
  if (mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Success!')),
    );
  }
} on NetworkException catch (e) {
  if (mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Network error: ${e.message}')),
    );
  }
} catch (e, stackTrace) {
  // Log for debugging, but don't expose details to user
  debugPrint('Error: $e\n$stackTrace');
  if (mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Something went wrong. Please try again.')),
    );
  }
}

// ❌ HIGH IMPACT: Unhandled Future errors
void _init() {
  _loadData(); // If this throws, it's unhandled!
}

// ✅ Handle async errors
void _init() async {
  try {
    await _loadData();
  } catch (e) {
    // Handle error
  }
}
```

### Widget Build Performance
```dart
// ❌ HIGH IMPACT: Creating objects in build method
@override
Widget build(BuildContext context) {
  return ListView.builder(
    controller: ScrollController(), // New instance every build!
    itemBuilder: (context, index) {
      return GestureDetector(
        onTap: () => _handleTap(index), // New closure every build!
        child: Text('Item $index'),
      );
    },
  );
}

// ✅ Create controllers as fields, use const where possible
final _scrollController = ScrollController();

@override
Widget build(BuildContext context) {
  return ListView.builder(
    controller: _scrollController,
    itemBuilder: (context, index) {
      return ItemTile(
        index: index,
        onTap: _handleTap,
      );
    },
  );
}

// ❌ HIGH IMPACT: Rebuilding entire tree
@override
Widget build(BuildContext context) {
  return Consumer<AppState>(
    builder: (context, state, child) {
      return Column(
        children: [
          ExpensiveWidget(), // Rebuilds even if unrelated state changes
          Text('Count: ${state.count}'),
        ],
      );
    },
  );
}

// ✅ Minimize rebuild scope
@override
Widget build(BuildContext context) {
  return Column(
    children: [
      const ExpensiveWidget(), // Doesn't rebuild
      Consumer<AppState>(
        builder: (context, state, child) {
          return Text('Count: ${state.count}');
        },
      ),
    ],
  );
}
```

---

## Quick Reference

### Secure Debug Logging
```dart
// ❌ Logging in production
print('User data: $userData');

// ✅ Only log in debug mode
if (kDebugMode) {
  print('User data: $userData');
}

// ✅ Or use a logger that respects build mode
class AppLogger {
  static void debug(String message) {
    if (kDebugMode) {
      debugPrint(message);
    }
  }
}
```

### Secure Local Data
```dart
// ✅ Clear sensitive data on logout
Future<void> logout() async {
  final secureStorage = const FlutterSecureStorage();
  await secureStorage.deleteAll();
  
  final prefs = await SharedPreferences.getInstance();
  await prefs.clear();
}
```

### Jailbreak/Root Detection
```dart
// ✅ For high-security apps, detect compromised devices
Future<bool> isDeviceSecure() async {
  // Use packages like flutter_jailbreak_detection
  // or safe_device
  final isJailbroken = await SafeDevice.isJailBroken;
  return !isJailbroken;
}
```

---

## 🔐 Secrets & Config Safety

> See `references/secrets-safety.md` for comprehensive patterns.

### Accidental Secret Commits

```dart
// ❌ CRITICAL: Hardcoded secrets in Dart code
class Config {
  static const apiKey = 'sk-live-xxx123';
  static const stripeSecret = 'sk_live_abcdef123456';
  static const firebaseKey = 'AIzaSyXXXXXXXXXXXXX';
}

// ❌ CRITICAL: Hardcoded in environment.dart
class Environment {
  static const production = {
    'apiUrl': 'https://api.example.com',
    'apiKey': 'real-api-key-here', // RED FLAG!
  };
}

// ✅ Use dart-define for secrets
class Config {
  static const apiKey = String.fromEnvironment('API_KEY');
  static const apiUrl = String.fromEnvironment('API_URL');
}
// Build: flutter build --dart-define=API_KEY=xxx --dart-define=API_URL=https://...
```

### Firebase & Google Services

```dart
// ❌ CRITICAL: google-services.json committed
// ❌ CRITICAL: GoogleService-Info.plist committed

// These files contain API keys and should be:
// 1. In .gitignore
// 2. Downloaded during CI/CD
// 3. Or use environment-specific files

// ✅ Add to .gitignore
// android/app/google-services.json
// ios/Runner/GoogleService-Info.plist
```

### Config Files to Watch

```dart
// ❌ CRITICAL: Secrets in pubspec.yaml or analysis_options.yaml
// (Unlikely but check for custom configurations)

// ❌ CRITICAL: Secrets in assets (JSON config files)
// assets/config.json with real API keys

// ✅ Use build-time injection
const apiKey = String.fromEnvironment('API_KEY', defaultValue: '');
if (apiKey.isEmpty) {
  throw Exception('API_KEY not configured');
}
```

### SharedPreferences Safety

```dart
// ❌ CRITICAL: Sensitive data in SharedPreferences
final prefs = await SharedPreferences.getInstance();
await prefs.setString('api_token', token);
await prefs.setString('user_password', password);

// ✅ Use FlutterSecureStorage for sensitive data
final storage = const FlutterSecureStorage();
await storage.write(key: 'api_token', value: token);

// ✅ Or use encrypted_shared_preferences
```

### Debug vs Release Builds

```dart
// ❌ CRITICAL: Debug logging with secrets in release
void makeApiCall() {
  print('Using API key: $apiKey'); // Logged in release!
}

// ✅ Only log in debug mode
void makeApiCall() {
  if (kDebugMode) {
    print('Making API call...');
  }
}
```

### Suspicious Patterns to Flag

| Pattern | Risk | Action |
|---------|------|--------|
| `const apiKey = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `const secret = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `sk_live_` or `pk_live_` | 🔴 CRITICAL | Block PR |
| `AIzaSy` (Firebase/Google key) | 🔴 CRITICAL | Block PR |
| `google-services.json` in diff | 🔴 CRITICAL | Block PR |
| `GoogleService-Info.plist` in diff | 🔴 CRITICAL | Block PR |
| `-----BEGIN.*PRIVATE KEY-----` | 🔴 CRITICAL | Block PR |
| `assets/*.json` with credentials | 🟡 HIGH | Review |
| `SharedPreferences` storing tokens | 🟡 HIGH | Review |
