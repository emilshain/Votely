document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';

    // Helper functions
    // Helper functions
    function showMessage(message, type = 'info') {
        const container = document.querySelector('.toast-container') || createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Trigger reflow to enable transition
        void toast.offsetWidth;

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    function navigateTo(url) {
        window.location.href = url;
    }

    function getToken() {
        return localStorage.getItem('token');
    }

    function getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    function setUserData(user, token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    }

    function clearUserData() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    function isAuthenticated() {
        return getToken() !== null;
    }

    function checkAuthAndRedirect() {
        if (!isAuthenticated() && !window.location.pathname.includes('login.html') &&
            !window.location.pathname.includes('register.html') &&
            !window.location.pathname.includes('forgotPassword.html') &&
            !window.location.search.includes('token=')) {
            navigateTo('login.html');
        }
    }

    // Check authentication on page load
    checkAuthAndRedirect();

    function updateNavbar() {
        const userSpans = document.querySelectorAll('.navbar span:first-child');
        const user = getUser();
        if (user && userSpans.length > 0) {
            userSpans.forEach(span => {
                span.textContent = user.name || user.username;
            });
        }
    }

    // Check authentication on page load
    checkAuthAndRedirect();

    // Update navbar on load
    updateNavbar();

    // --- LOGIN PAGE ---
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        // ... (lines 88-113)
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    setUserData(data.user, data.token);
                    updateNavbar(); // Update navbar immediately
                    showMessage('Login successful!', 'success');
                    navigateTo('vote.html');
                } else {
                    showMessage(data.error || 'Login failed', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
    }

    // --- REGISTER PAGE ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            if (password !== confirmPassword) {
                showMessage('Passwords do not match!', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, confirmPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('Registration successful! Please login.', 'success');
                    setTimeout(() => {
                        navigateTo('login.html');
                    }, 1500); // Small delay to let user see the success message
                } else {
                    showMessage(data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
    }

    // --- FORGOT PASSWORD ---
    if (document.title.includes('Forgot Password')) {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = form.username.value;

                // In a real app, you would use email
                showMessage('Password reset feature coming soon. For now, contact admin.', 'info');
                setTimeout(() => {
                    navigateTo('login.html');
                }, 2000);
            });
        }
    }

    // --- VOTE PAGE ---
    if (document.title.includes('Candidates')) {
        // Load candidates
        loadCandidates();

        // Setup vote buttons
        setupVoteButtons();

        // Update navbar immediately to ensure name is correct if coming from login
        updateNavbar();
    }

    // --- VOTERS PAGE ---
    if (document.title.includes('Voters')) {
        loadVoters();
        updateNavbar();
    }

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearUserData();
            navigateTo('login.html');
        });
    }

    // Helper function to load candidates
    async function loadCandidates() {
        try {
            const response = await fetch(`${API_BASE_URL}/vote/candidates`);
            const data = await response.json();

            if (response.ok && data.candidates) {
                const candidatesContainer = document.querySelector('.candidates');
                if (candidatesContainer && data.candidates.length > 0) {
                    updateCandidateDisplay(data.candidates);
                }
            }
        } catch (error) {
            console.error('Failed to load candidates:', error);
        }
    }

    function updateCandidateDisplay(candidates) {
        // Candidates are currently hardcoded in HTML, so we just log for now
        console.log('Loaded candidates:', candidates);
    }

    function setupVoteButtons() {
        const voteBtns = document.querySelectorAll('.voteBtn');
        voteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                if (!isAuthenticated()) {
                    showMessage('Please login to vote', 'error');
                    navigateTo('login.html');
                    return;
                }

                const card = e.target.closest('.candidate');
                const candidateId = card.id.replace('cand', '');
                const candidateName = card.querySelector('h2').textContent;

                try {
                    const user = getUser();
                    if (user && user.hasVoted) {
                        showMessage('You have already voted!', 'error');
                        setTimeout(() => {
                            navigateTo('voters.html');
                        }, 1500);
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/vote/vote`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify({ candidateId })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        showMessage(`Vote cast for ${candidateName}!`, 'success');
                        if (data.hasVoted) {
                            const user = getUser();
                            user.hasVoted = true;
                            setUserData(user, getToken());
                        }
                        setTimeout(() => {
                            navigateTo('voters.html');
                        }, 1500);
                    } else {
                        showMessage(data.error || 'Failed to cast vote', 'error');
                    }
                } catch (error) {
                    showMessage('Network error. Please try again.', 'error');
                }
            });
        });
    }

    async function loadVoters() {
        try {
            const response = await fetch(`${API_BASE_URL}/vote/voters`);
            const data = await response.json();

            if (response.ok && data.voters) {
                const votersList = document.querySelector('.voters');
                if (votersList && data.voters.length > 0) {
                    votersList.innerHTML = '';
                    data.voters.forEach(voter => {
                        const li = document.createElement('li');
                        li.textContent = `${voter.username} voted for ${voter.candidate_name}`;
                        votersList.appendChild(li);
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load voters:', error);
        }
    }

    // Check for token in URL (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        // Fetch user profile
        fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUserData(data.user, token);
                    updateNavbar(); // Update immediately after fetching profile
                    // Remove token from URL without refresh
                    window.history.replaceState({}, document.title, window.location.pathname);
                    showMessage('Login successful!', 'success');
                    // If we are on login page, go to vote, otherwise we are already on vote page (likely)
                    if (window.location.pathname.includes('login.html')) {
                        navigateTo('vote.html');
                    }
                }
            })
            .catch(err => console.error('Error fetching profile:', err));
    }

    // OAuth buttons
    const oauthBtns = document.querySelectorAll('.oauth button');
    oauthBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const provider = btn.innerText.includes('Google') ? 'google' : 'linkedin';
            window.location.href = `${API_BASE_URL}/auth/${provider}`;
        });
    });
});