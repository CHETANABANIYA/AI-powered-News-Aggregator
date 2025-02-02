function togglePassword() {
    var passwordField = document.getElementById('password');
    var type = passwordField.type === 'password' ? 'text' : 'password';
    passwordField.type = type;
}
