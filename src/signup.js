document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signup-form");
    const loadingIndicator = document.getElementById("loading");

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        loadingIndicator.style.display = 'block';

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("https://ai-powered-news-aggregator-backend.onrender.com/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            loadingIndicator.style.display = 'none';

            if (response.ok) {
                alert("✅ Account created successfully!");
                window.location.href = "login.html";
            } else {
                alert(`❌ Signup failed: ${data.message}`);
            }
        } catch (error) {
            loadingIndicator.style.display = 'none';
            alert("❌ Error signing up. Please try again.");
        }
    });

    document.querySelector(".btn-google").addEventListener("click", function () {
        window.location.href = "https://ai-powered-news-aggregator-backend.onrender.com/auth/google";
    });

    document.querySelector(".btn-facebook").addEventListener("click", function () {
        window.location.href = "https://ai-powered-news-aggregator-backend.onrender.com/auth/facebook";
    });
});

