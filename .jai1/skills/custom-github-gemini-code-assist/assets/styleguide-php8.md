# PHP 8 Style Guide - Security & High-Impact Focus

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
- Type declaration preferences (PHP 8 features)

---

## Security Checklist

### SQL Injection Prevention
```php
// ❌ CRITICAL: SQL Injection vulnerability
$users = DB::select("SELECT * FROM users WHERE name = '$name'");

// ✅ Use parameter binding
$users = DB::select('SELECT * FROM users WHERE name = ?', [$name]);

// ✅ Use Eloquent with proper escaping
$users = User::where('name', $name)->get();

// ✅ Use named parameters
$users = DB::select('SELECT * FROM users WHERE name = :name', ['name' => $name]);
```

### XSS Prevention
```php
// ❌ CRITICAL: XSS vulnerability
{!! $userInput !!}
echo $userInput;

// ✅ Use Blade's auto-escaping
{{ $userInput }}

// ✅ Or explicit escaping
{!! e($userInput) !!}
```

### CSRF Protection
```php
// ❌ CRITICAL: Missing CSRF protection on state-changing routes
Route::post('/users', [UserController::class, 'store']);

// ✅ CSRF is automatic with web middleware
// Ensure form includes @csrf directive
<form method="POST">
    @csrf
</form>

// For APIs, use Sanctum/Passport instead
```

### Authentication & Authorization
```php
// ❌ CRITICAL: Missing authorization
public function update(Request $request, User $user): JsonResponse
{
    $user->update($request->validated());
    return response()->json($user);
}

// ✅ Use policies and gates
public function update(UpdateUserRequest $request, User $user): JsonResponse
{
    $this->authorize('update', $user);
    $user->update($request->validated());
    return response()->json(new UserResource($user));
}

// ✅ Use Form Request authorization
final class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('user'));
    }
}
```

### Sensitive Data Protection
```php
// ❌ CRITICAL: Logging sensitive data
Log::info('Payment', ['card' => $cardNumber, 'cvv' => $cvv]);

// ✅ Never log sensitive data
Log::info('Payment processed', [
    'user_id' => $user->id,
    'amount' => $amount,
    'last_four' => substr($cardNumber, -4),
]);

// ❌ CRITICAL: Returning sensitive data
return response()->json($user->toArray());

// ✅ Use Resources to control output
return response()->json(new UserResource($user));

// ✅ Hide sensitive attributes in model
protected $hidden = ['password', 'remember_token', 'two_factor_secret'];
```

### File Upload Security
```php
// ❌ CRITICAL: No validation
public function upload(Request $request): JsonResponse
{
    $path = $request->file('file')->store('uploads');
    return response()->json(['path' => $path]);
}

// ✅ Validate file type, size, and sanitize name
public function upload(Request $request): JsonResponse
{
    $validated = $request->validate([
        'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
    ]);
    
    $file = $request->file('file');
    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
    $path = $file->storeAs('uploads', $filename, 'private');
    
    return response()->json(['path' => $path]);
}
```

### Mass Assignment Protection
```php
// ❌ CRITICAL: Mass assignment vulnerability
User::create($request->all());
$user->update($request->input());

// ✅ Use validated data only
User::create($request->validated());

// ✅ Or explicitly select fields
$user->update($request->only(['name', 'email']));

// ✅ Use readonly DTO for safety
final readonly class CreateUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}
```

---

## High-Impact Issues

### N+1 Query Problem
```php
// ❌ HIGH IMPACT: N+1 queries (100 posts = 101 queries)
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;
    echo $post->comments->count();
}

// ✅ Eager loading (3 queries total)
$posts = Post::with(['author', 'comments'])->get();
foreach ($posts as $post) {
    echo $post->author->name;
    echo $post->comments->count();
}

// ✅ Count without loading
$posts = Post::withCount('comments')->with('author')->get();
```

### Memory Issues with Large Datasets
```php
// ❌ HIGH IMPACT: Loading millions of records
$users = User::all(); // OutOfMemoryError

// ✅ Use chunking
User::chunk(1000, function (Collection $users): void {
    foreach ($users as $user) {
        // Process
    }
});

// ✅ Use lazy collections (memory efficient)
User::lazy()->each(function (User $user): void {
    // Process one at a time
});

// ✅ Use cursor for read-only operations
foreach (User::cursor() as $user) {
    // Process
}
```

### Transaction Safety
```php
// ❌ HIGH IMPACT: Partial data corruption risk
$order = Order::create($orderData);
$payment = Payment::create($paymentData); // May fail
$inventory->decrement('quantity', $order->quantity);

// ✅ Use database transactions
DB::transaction(function () use ($orderData, $paymentData, $quantity): void {
    $order = Order::create($orderData);
    Payment::create([...$paymentData, 'order_id' => $order->id]);
    Inventory::where('product_id', $order->product_id)
        ->decrement('quantity', $quantity);
});
```

### Error Information Disclosure
```php
// ❌ HIGH IMPACT: Exposing internal errors to users
public function process(Request $request): JsonResponse
{
    try {
        return $this->service->process($request->validated());
    } catch (Throwable $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(), // Never expose!
        ], 500);
    }
}

// ✅ Log details, return generic message
public function process(Request $request): JsonResponse
{
    try {
        return $this->service->process($request->validated());
    } catch (Throwable $e) {
        Log::error('Processing failed', [
            'error' => $e->getMessage(),
            'user_id' => $request->user()?->id,
            'input' => $request->except(['password', 'token']),
        ]);
        
        return response()->json([
            'error' => 'An error occurred. Please try again.',
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}
```

### Rate Limiting
```php
// ❌ HIGH IMPACT: No rate limiting on sensitive endpoints
Route::post('/login', [AuthController::class, 'login']);
Route::post('/password/reset', [PasswordController::class, 'reset']);

// ✅ Apply rate limiting
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 attempts per minute

Route::post('/password/reset', [PasswordController::class, 'reset'])
    ->middleware('throttle:3,60'); // 3 attempts per hour
```

---

## Quick Reference

### Environment & Secrets
```php
// ❌ Hardcoded secrets
$apiKey = 'sk-live-xxx123';
config(['services.stripe.key' => 'sk-live-xxx']);

// ✅ Use environment variables
$apiKey = config('services.stripe.key');
// .env: STRIPE_KEY=sk-live-xxx
```

### Password Handling
```php
// ❌ Weak hashing
$hash = md5($password);
$hash = sha1($password);

// ✅ Use Laravel's Hash facade (bcrypt/argon2)
$hash = Hash::make($password);

// ✅ Verify passwords
if (Hash::check($password, $user->password)) {
    // Valid
}

// ✅ Rehash if needed
if (Hash::needsRehash($user->password)) {
    $user->password = Hash::make($password);
    $user->save();
}
```

### Session Security
```php
// ✅ After login - prevent session fixation
$request->session()->regenerate();

// ✅ After logout - destroy session
$request->session()->invalidate();
$request->session()->regenerateToken();
```

### API Token Security
```php
// ❌ Token in URL (logged in access logs)
GET /api/users?token=abc123

// ✅ Token in Authorization header
Authorization: Bearer abc123

// ✅ Use Sanctum for SPA authentication
// ✅ Use Passport for OAuth2
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
$openaiKey = 'sk-proj-abc123xyz';

// ❌ CRITICAL: Hardcoded in config files
// config/services.php
return [
    'stripe' => [
        'secret' => 'sk_live_xxx', // RED FLAG!
    ],
    'openai' => [
        'key' => 'sk-proj-xxx', // RED FLAG!
    ],
];

// ✅ Always use environment variables
$apiKey = config('services.stripe.secret');

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
STRIPE_SECRET=sk_live_xxx

# ✅ .env.example should have placeholders
APP_KEY=
DB_PASSWORD=your-password-here
STRIPE_SECRET=sk_test_xxx
```

### Suspicious Patterns to Flag

| Pattern | Risk | Action |
|---------|------|--------|
| `password = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `secret = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `AKIA[A-Z0-9]{16}` (AWS key) | 🔴 CRITICAL | Block PR |
| `sk_live_` or `pk_live_` | 🔴 CRITICAL | Block PR |
| `sk-proj-` or `sk-ant-` (AI keys) | 🔴 CRITICAL | Block PR |
| `.env` file in diff | 🔴 CRITICAL | Block PR |
| `-----BEGIN.*PRIVATE KEY-----` | 🔴 CRITICAL | Block PR |
| `config/*.php` with hardcoded strings | 🟡 HIGH | Review |
| Base64 strings in config | 🟡 HIGH | Review |
