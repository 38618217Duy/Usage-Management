# PHP 7 Style Guide - Security & High-Impact Focus

## Review Priority

> ⚠️ **For teams without dedicated reviewers**: This guide focuses on **security vulnerabilities, critical bugs, and high-impact issues** only. Minor style issues should be ignored.

### Critical (Must Fix)
1. **Security vulnerabilities** - SQL injection, XSS, CSRF, authentication bypass
2. **Data exposure** - Sensitive data in logs, responses, or errors
3. **Critical bugs** - Data loss, corruption, or system crashes
4. **Performance disasters** - N+1 queries, memory leaks, infinite loops

### High (Should Fix)
1. **Authorization issues** - Missing permission checks
2. **Input validation** - Unvalidated user input
3. **Error disclosure** - Stack traces or internal errors exposed
4. **Resource leaks** - Unclosed connections, file handles

### Ignore
- Code formatting and style
- Variable naming preferences
- PHPDoc completeness
- Minor refactoring suggestions

---

## Security Checklist

### SQL Injection Prevention
```php
// ❌ CRITICAL: SQL Injection vulnerability
$users = DB::select("SELECT * FROM users WHERE name = '$name'");

// ✅ Use parameter binding
$users = DB::select('SELECT * FROM users WHERE name = ?', [$name]);

// ✅ Use Eloquent
$users = User::where('name', $name)->get();
```

### XSS Prevention
```php
// ❌ CRITICAL: XSS vulnerability
echo "<p>Hello, $name</p>";
{!! $userInput !!}

// ✅ Escape output
echo "<p>Hello, " . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "</p>";
{{ $userInput }}  // Blade auto-escapes
```

### CSRF Protection
```php
// ❌ CRITICAL: Missing CSRF token
<form method="POST" action="/update">
    <input type="text" name="data">
</form>

// ✅ Include CSRF token
<form method="POST" action="/update">
    @csrf
    <input type="text" name="data">
</form>
```

### Authentication & Authorization
```php
// ❌ CRITICAL: Missing authorization check
public function deleteUser($id)
{
    User::destroy($id);
}

// ✅ Check permissions
public function deleteUser($id)
{
    $this->authorize('delete', User::find($id));
    User::destroy($id);
}

// ✅ Use middleware
Route::delete('/users/{id}', [UserController::class, 'destroy'])
    ->middleware(['auth', 'can:delete-users']);
```

### Sensitive Data Protection
```php
// ❌ CRITICAL: Logging sensitive data
Log::info('User login', ['password' => $password]);
Log::debug('Payment data', ['card_number' => $card]);

// ✅ Never log sensitive data
Log::info('User login', ['user_id' => $user->id]);
Log::debug('Payment processed', ['transaction_id' => $txId]);

// ❌ CRITICAL: Exposing sensitive data in response
return response()->json($user); // May include password_hash

// ✅ Use API resources to control output
return response()->json(new UserResource($user));
```

### File Upload Security
```php
// ❌ CRITICAL: Unrestricted file upload
$request->file('upload')->store('uploads');

// ✅ Validate file type and size
$request->validate([
    'upload' => 'required|file|mimes:pdf,doc,docx|max:10240',
]);
$request->file('upload')->store('uploads');
```

### Mass Assignment Protection
```php
// ❌ CRITICAL: Mass assignment vulnerability
User::create($request->all());
$user->update($request->all());

// ✅ Use $fillable or $guarded
protected $fillable = ['name', 'email'];

// ✅ Only use validated data
User::create($request->validated());
$user->update($request->only(['name', 'email']));
```

---

## High-Impact Issues

### N+1 Query Problem
```php
// ❌ HIGH IMPACT: N+1 queries
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name; // Query per iteration
}

// ✅ Eager loading
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name; // No additional queries
}
```

### Memory Issues
```php
// ❌ HIGH IMPACT: Loading all records into memory
$users = User::all();
foreach ($users as $user) {
    // Process
}

// ✅ Use chunking for large datasets
User::chunk(1000, function ($users) {
    foreach ($users as $user) {
        // Process
    }
});

// ✅ Or use lazy collections
User::lazy()->each(function ($user) {
    // Process
});
```

### Transaction Safety
```php
// ❌ HIGH IMPACT: Data inconsistency risk
$order = Order::create($orderData);
$payment = Payment::create($paymentData);
// If payment fails, orphan order created

// ✅ Use transactions
DB::transaction(function () use ($orderData, $paymentData) {
    $order = Order::create($orderData);
    $payment = Payment::create($paymentData);
});
```

### Error Handling
```php
// ❌ HIGH IMPACT: Exposing internal errors
try {
    $result = $this->process();
} catch (\Exception $e) {
    return response()->json(['error' => $e->getMessage()], 500);
}

// ✅ Hide internal details in production
try {
    $result = $this->process();
} catch (\Exception $e) {
    Log::error('Processing failed', ['error' => $e->getMessage()]);
    return response()->json(['error' => 'An error occurred'], 500);
}
```

---

## Quick Reference

### Environment Variables
```php
// ❌ Hardcoded credentials
$apiKey = 'sk-xxx123';
$dbPassword = 'secret123';

// ✅ Use environment variables
$apiKey = env('API_KEY');
$dbPassword = env('DB_PASSWORD');
```

### Password Handling
```php
// ❌ Plain text or weak hashing
$user->password = md5($password);
$user->password = sha1($password);

// ✅ Use bcrypt/argon2
$user->password = Hash::make($password);
$user->password = bcrypt($password);
```

### Session Security
```php
// ✅ Regenerate session on login
$request->session()->regenerate();

// ✅ Invalidate on logout
$request->session()->invalidate();
$request->session()->regenerateToken();
```

---

## 🔐 Secrets & Config Safety

> See `references/secrets-safety.md` for comprehensive patterns.

### Accidental Secret Commits

```php
// ❌ CRITICAL: Hardcoded secrets in code
$apiKey = 'sk-live-xxx123';
$stripeSecret = 'sk_live_abcdef123456';
$awsKey = 'AKIAIOSFODNN7EXAMPLE';

// ❌ CRITICAL: Hardcoded in config files
// config/services.php
return [
    'stripe' => [
        'secret' => 'sk_live_xxx', // RED FLAG!
    ],
];

// ✅ Always use environment variables
$apiKey = env('API_KEY');

// config/services.php
return [
    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
    ],
];
```

### Config Files to Watch

```php
// ❌ CRITICAL: Real credentials in config/database.php
'mysql' => [
    'host' => 'production-db.example.com',
    'username' => 'admin',
    'password' => 'P@ssw0rd123!', // RED FLAG!
],

// ✅ Safe: Using env()
'mysql' => [
    'host' => env('DB_HOST', '127.0.0.1'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
],
```

### .env File Safety

```bash
# ❌ CRITICAL: .env committed to repository
# Check: Is .env in .gitignore?

# ❌ CRITICAL: .env.example with real values
APP_KEY=base64:RealSecretKeyHere==
DB_PASSWORD=actualPassword123

# ✅ .env.example should have placeholders
APP_KEY=
DB_PASSWORD=your-password-here
```

### Suspicious Patterns to Flag

| Pattern | Risk | Action |
|---------|------|--------|
| `password = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `secret = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `AKIA[A-Z0-9]{16}` (AWS key) | 🔴 CRITICAL | Block PR |
| `sk_live_` or `sk_test_` | 🔴 CRITICAL | Block PR |
| `.env` file in diff | 🔴 CRITICAL | Block PR |
| `config/*.php` with hardcoded strings | 🟡 HIGH | Review |
| Base64 strings in config | 🟡 HIGH | Review |
