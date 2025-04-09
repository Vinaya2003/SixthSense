// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/public/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const messageScreen = document.getElementById('message-screen');
const adminScreen = document.getElementById('admin-screen');
const sosScreen = document.getElementById('sos-screen');
const assistiveOverlay = document.getElementById('assistive-overlay');
const assistiveFeedback = document.getElementById('assistive-feedback');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const userTypeSelect = document.getElementById('user-type');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const backBtn = document.getElementById('back-btn');
const screenTitle = document.getElementById('screen-title');
const userInfo = document.getElementById('user-info');
const gestureContainer = document.getElementById('gesture-container');
const messagesContainer = document.getElementById('messages-container');
const adminMessagesContainer = document.getElementById('admin-messages-container');
const messageText = document.getElementById('message-text');
const adminMessageText = document.getElementById('admin-message-text');
const voiceInputBtn = document.getElementById('voice-input-btn');
const sendBtn = document.getElementById('send-btn');
const adminSendBtn = document.getElementById('admin-send-btn');
const cancelSosBtn = document.getElementById('cancel-sos-btn');

// Sample users for demo
const users = {
    admin: { username: 'admin', password: 'admin123', type: 'admin' },
    client: { username: 'user', password: 'user123', type: 'client' }
};

// Current user and app state
let currentUser = null;
let currentScreen = 'login';
let isRecording = false;
let messagePollingInterval = null; // For real-time message polling

// Sample messages for demo
const messages = [
    {
        sender: 'admin',
        content: 'Welcome to Vision Voice! How can I help you today?',
        timestamp: new Date()
    },
    {
        sender: 'client',
        content: 'Hello, I need assistance with navigation.',
        timestamp: new Date()
    }
];

// Make messages array globally accessible
window.messages = messages;

// Initialize the application
function initApp() {
    // Load saved messages from localStorage
    const savedMessages = localStorage.getItem('visionVoiceMessages');
    if (savedMessages) {
        try {
            const parsedMessages = JSON.parse(savedMessages);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                // Convert string timestamps back to Date objects
                parsedMessages.forEach(msg => {
                    msg.timestamp = new Date(msg.timestamp);
                });
                // Replace the messages array with saved messages
                while (messages.length) messages.pop(); // Clear array
                parsedMessages.forEach(msg => messages.push(msg)); // Add saved messages
                console.log("Loaded saved messages:", messages.length);
            }
        } catch (e) {
            console.error("Error loading saved messages:", e);
        }
    }

    // Add event listeners
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    
    // Handle back button - need to select all instances since they share the same ID
    const backButtons = document.querySelectorAll('#back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', navigateBack);
    });
    
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    // Add admin send button listener
    const adminSendButton = document.getElementById('admin-send-btn');
    if (adminSendButton) {
        adminSendButton.addEventListener('click', sendAdminMessage);
        console.log('Admin send button listener added');
    } else {
        console.warn('Admin send button not found');
    }
    
    if (voiceInputBtn) voiceInputBtn.addEventListener('click', toggleVoiceInput);
    if (cancelSosBtn) cancelSosBtn.addEventListener('click', cancelSOS);
    
    // Add tap event to the entire document for client accessibility
    document.addEventListener('click', handleScreenTap);
    
    // Initialize speech synthesis and recognition for client users
    initSpeechSynthesis();
    initSpeechRecognition();
    
    // Initialize gesture detection for client users
    initGestureDetection();
    
    // Log initialization status
    console.log('App initialized with', messages.length, 'messages');
    
    // Announce app loaded only for screen readers
    speakText("Vision Voice app loaded. Please login with your username and password.");
}

// Handle tap anywhere on the screen (for client only)
function handleScreenTap(event) {
    // Only process taps when on the message screen AND the user is a client
    if (currentScreen !== 'messages' || (currentUser && currentUser.type !== 'client')) return;
    
    // Ignore taps on specific buttons to prevent double actions
    if (event.target === sendBtn || 
        event.target === voiceInputBtn || 
        event.target === backBtn) {
        return;
    }
    
    // Toggle recording state
    if (!isRecording) {
        // Start recording
        startRecognition();
        isRecording = true;
        showAssistiveFeedback('Recording started. Tap anywhere to stop and send.');
        speakText('Recording started. Tap anywhere to stop and send.');
    } else {
        // Stop recording and send if there's content
        stopRecognition();
        isRecording = false;
        
        if (messageText.value.trim()) {
            sendMessage();
        } else {
            showAssistiveFeedback('No message recorded. Tap again to try.');
            speakText('No message recorded. Tap again to try.');
        }
    }
}

// Handle login functionality
function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const userType = userTypeSelect.value;
    
    if (!username || !password) {
        loginError.textContent = 'Please enter username and password';
        speakText('Please enter username and password');
        return;
    }
    
    // Check if user exists (in a real app, this would be an API call)
    let isValidUser = false;
    
    if (userType === 'admin' && username === users.admin.username && password === users.admin.password) {
        currentUser = { ...users.admin, username };
        isValidUser = true;
    } else if (userType === 'client' && username === users.client.username && password === users.client.password) {
        currentUser = { ...users.client, username };
        isValidUser = true;
    }
    
    if (isValidUser) {
        userInfo.textContent = `${username} (${userType})`;
        
        // Navigate to different screens based on user type
        if (currentUser.type === 'admin') {
            navigateTo('admin');
        } else {
            navigateTo('main');
            speakText(`Welcome ${username}. Swipe up to send message, swipe down to read the last message from admin.`);
        }
        
        // Start real-time message polling
        startMessagePolling();
    } else {
        loginError.textContent = 'Invalid username or password';
        speakText('Invalid username or password. Please try again.');
    }
}

// Navigation functions
function navigateTo(screen) {
    // Hide all screens
    loginScreen.classList.remove('active');
    mainScreen.classList.remove('active');
    messageScreen.classList.remove('active');
    sosScreen.classList.remove('active');
    if (adminScreen) adminScreen.classList.remove('active');
    
    // Show selected screen
    switch (screen) {
        case 'login':
            loginScreen.classList.add('active');
            currentScreen = 'login';
            screenTitle.textContent = 'Vision Voice';
            break;
        case 'main':
            // Only for client users
            mainScreen.classList.add('active');
            gestureContainer.style.display = 'flex';
            messageScreen.style.display = 'none';
            currentScreen = 'main';
            screenTitle.textContent = 'Gesture Controls';
            
            // Announce gesture controls guidance for client
            if (currentUser && currentUser.type === 'client') {
                setTimeout(() => {
                    speakText('Swipe up to send a message. Swipe down to read the last message from admin.');
                }, 1000);
            }
            break;
        case 'messages':
            // Only for client users
            mainScreen.classList.add('active');
            gestureContainer.style.display = 'none';
            messageScreen.style.display = 'block';
            currentScreen = 'messages';
            screenTitle.textContent = 'Messages';
            loadMessages(messagesContainer);
            
            // Only announce for client users
            if (currentUser && currentUser.type === 'client') {
                speakText("Tap once to start voice input. Tap again to stop and send your message.");
            }
            break;
        case 'admin':
            // Only for admin users
            if (adminScreen) {
                adminScreen.classList.add('active');
                currentScreen = 'admin';
                screenTitle.textContent = 'Admin Dashboard';
                loadMessages(adminMessagesContainer);
            }
            break;
        case 'sos':
            sosScreen.classList.add('active');
            currentScreen = 'sos';
            screenTitle.textContent = 'SOS Emergency';
            if (currentUser && currentUser.type === 'client') {
                speakText('SOS activated. Emergency contacts are being notified.');
            }
            break;
    }
}

function navigateBack() {
    if (currentScreen === 'messages') {
        navigateTo('main');
    } else if (currentScreen === 'main' || currentScreen === 'admin') {
        // Confirm before logout
        if (confirm('Do you want to logout?')) {
            // Store user type before clearing currentUser
            const wasClient = currentUser && currentUser.type === 'client';
            
            // Stop polling when logging out
            stopMessagePolling();
            
            currentUser = null;
            navigateTo('login');
            
            if (wasClient) {
                speakText('You have been logged out.');
            }
        }
    }
}

// Message functions
function loadMessages(container) {
    if (!container) {
        console.error("Message container not found");
        return;
    }
    
    console.log("Loading messages into container:", container.id);
    
    container.innerHTML = '';
    
    if (messages.length === 0) {
        const noMessagesElement = document.createElement('div');
        noMessagesElement.classList.add('no-messages');
        noMessagesElement.textContent = 'No messages yet';
        container.appendChild(noMessagesElement);
        return;
    }
    
    messages.forEach((message, index) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.dataset.index = index;
        
        if (message.sender === 'client') {
            messageElement.classList.add('client');
        } else if (message.sender === 'admin') {
            messageElement.classList.add('admin');
        }
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${time}</div>
        `;
        
        container.appendChild(messageElement);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
    
    console.log(`Loaded ${messages.length} messages into ${container.id}`);
}

// Real-time message polling functions
function startMessagePolling() {
    // Clear any existing interval first
    stopMessagePolling();
    
    // Check for new messages every 2 seconds
    messagePollingInterval = setInterval(() => {
        checkForNewMessages();
    }, 2000);
    
    console.log("Started real-time message polling");
}

function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
        console.log("Stopped message polling");
    }
}

// Mock implementation of checking for new messages
// In a real app, this would be an API call to a server
function checkForNewMessages() {
    // For this demo, we'll just reload messages from localStorage
    // to simulate receiving new messages from another user
    const savedMessages = localStorage.getItem('visionVoiceMessages');
    if (savedMessages) {
        try {
            const parsedMessages = JSON.parse(savedMessages);
            
            // Check if there are new messages
            if (parsedMessages.length > messages.length) {
                console.log("New messages detected:", parsedMessages.length - messages.length);
                
                // Get the last message for notification
                const lastMessage = parsedMessages[parsedMessages.length - 1];
                const isNewMessageFromOther = 
                    (currentUser && currentUser.type === 'client' && lastMessage.sender === 'admin') ||
                    (currentUser && currentUser.type === 'admin' && lastMessage.sender === 'client');
                
                // Update local messages array
                while (messages.length) messages.pop(); // Clear array
                parsedMessages.forEach(msg => {
                    // Convert string timestamps back to Date objects
                    msg.timestamp = new Date(msg.timestamp);
                    messages.push(msg);
                });
                
                // Refresh message displays
                updateMessageDisplays();
                
                // Notify of new messages if relevant
                if (isNewMessageFromOther) {
                    if (currentUser.type === 'client') {
                        showAssistiveFeedback('New message from admin');
                        speakText(`New message from admin: ${lastMessage.content}`);
                    } else {
                        showAssistiveFeedback('New message from client');
                        playNotificationSound();
                    }
                }
            }
        } catch (e) {
            console.error("Error checking for new messages:", e);
        }
    }
}

// Play notification sound
function playNotificationSound() {
    const notification = document.getElementById('message-notification');
    if (notification) {
        notification.currentTime = 0;
        notification.play().catch(e => console.error("Error playing notification sound:", e));
    }
}

// Update all active message displays
function updateMessageDisplays() {
    if (currentScreen === 'admin' && adminMessagesContainer) {
        loadMessages(adminMessagesContainer);
    } else if (currentScreen === 'messages' && messagesContainer) {
        loadMessages(messagesContainer);
    }
}

// Send message from client
function sendMessage() {
    const content = messageText.value.trim();
    
    if (!content) {
        if (currentUser && currentUser.type === 'client') {
            speakText('Please enter a message before sending.');
        }
        return;
    }
    
    const newMessage = {
        sender: 'client',
        content,
        timestamp: new Date()
    };
    
    console.log("Client sending message:", newMessage);
    messages.push(newMessage);
    messageText.value = '';
    
    // Update UI immediately
    updateMessageDisplays();
    
    // Store messages in localStorage for persistence and real-time sharing
    localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
    
    // Confirm message sent with voice for client only
    if (currentUser && currentUser.type === 'client') {
        speakText(`Message sent: ${content}`);
    }
}

// Send message from admin
function sendAdminMessage() {
    if (!adminMessageText) {
        console.error("Admin message text area not found");
        return;
    }
    
    const content = adminMessageText.value.trim();
    
    if (!content) return;
    
    const newMessage = {
        sender: 'admin',
        content,
        timestamp: new Date()
    };
    
    console.log("Admin sending message:", newMessage);
    messages.push(newMessage);
    adminMessageText.value = '';
    
    // Update UI immediately
    updateMessageDisplays();
    
    // Store messages in localStorage for persistence and real-time sharing
    localStorage.setItem('visionVoiceMessages', JSON.stringify(messages));
}

// Read the last message from admin
function readLastAdminMessage() {
    console.log("Reading last admin message, total messages:", messages.length);
    
    // Find the last admin message
    let foundMessage = false;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        console.log("Checking message:", messages[i]);
        if (messages[i].sender === 'admin') {
            console.log("Found admin message:", messages[i].content);
            speakText(`Message from admin: ${messages[i].content}`);
            foundMessage = true;
            break;
        }
    }
    
    // If no messages found
    if (!foundMessage) {
        console.log("No admin messages found");
        speakText("No messages from admin yet.");
    }
}

// SOS functions
function activateSOS() {
    navigateTo('sos');
    
    // In a real app, this would contact emergency services or trusted contacts
    console.log('SOS activated!');
}

function cancelSOS() {
    navigateTo('main');
    if (currentUser && currentUser.type === 'client') {
        speakText('SOS canceled.');
    }
}

// Helper function for client speech
function speakText(text) {
    // Only speak if the current user is a client (blind user)
    if (currentUser && currentUser.type === 'client') {
        if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    } else if (!currentUser) {
        // On login screen, speak for everyone
        if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Make function globally accessible for gesture handling
window.readLastAdminMessage = readLastAdminMessage; 