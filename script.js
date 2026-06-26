const SUPABASE_URL = "https://yixrieizgpptpzkohxpp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tmxQYeFiFfHIIxdLSe0v6A_kfEpvrvz";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let userEmail = "";

// HTML एलिमेंट्स उठाना
const authModal = document.getElementById('authModal');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const chatContainer = document.getElementById('chatContainer');

const messagesBox = document.getElementById('messagesBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatStatus = document.getElementById('chatStatus');
const clearChatBtn = document.getElementById('clearChatBtn');
const attachBtn = document.getElementById('attachBtn');
const imageInput = document.getElementById('imageInput');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const searchFileInput = document.getElementById('searchFileInput');

// वर्तमान समय निकालने का फंक्शन
function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

// 🔐 1. नया अकाउंट बनाने का लॉजिक (Sign Up)
signupBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
        alert("कृपया ईमेल और पासवर्ड दोनों दर्ज करें!");
        return;
    }
    if (password.length < 6) {
        alert("पासवर्ड कम से कम 6 अक्षरों का होना चाहिए!");
        return;
    }

    signupBtn.innerText = "अकाउंट बन रहा है...";
    signupBtn.disabled = true;

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        alert("साइन अप फेल: " + error.message);
        signupBtn.innerText = "नया अकाउंट बनाएं (Sign Up)";
        signupBtn.disabled = false;
    } else {
        alert("🎉 अकाउंट सफलतापूर्वक बन गया! अब आप लॉगइन कर सकते हैं।");
        signupBtn.innerText = "नया Account बन गया";
        signupBtn.disabled = false;
    }
});

// 🔑 2. लॉगइन करने का लॉजिक (Log In)
loginBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
        alert("कृपया ईमेल और पासवर्ड दर्ज करें!");
        return;
    }

    loginBtn.innerText = "लॉगइन हो रहा है...";
    loginBtn.disabled = true;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("लॉगइन फेल: " + error.message);
        loginBtn.innerText = "लॉगइन करें";
        loginBtn.disabled = false;
    } else if (data.user) {
        userEmail = data.user.email;
        
        // लॉगइन सफल होने पर स्क्रीन बदलना
        authModal.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        // डेटा लोड करना और लाइव आना
        fetchMessages();
        setupRealtime();
    }
});

// 3. पुराने मैसेजेस लोड करना
async function fetchMessages() {
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error("मैसेज लोड एरर:", error);
        } else if (data) {
            messagesBox.innerHTML = '';
            data.forEach(msg => appendMessage(msg));
        }
    } catch (err) {
        console.error("नेटवर्क एरर:", err);
    }
}

// लिंक कॉपी करने का फंक्शन
window.copyToClipboard = function(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert("🔗 फाइल की डाउनलोड लिंक कॉपी हो गई है!");
    }).catch(err => {
        console.error("कॉपी करने में फेल:", err);
    });
}

// 4. स्क्रीन पर मैसेजेस और फाइल्स दिखाना
function appendMessage(msg) {
    if (msg.is_system) {
        const sysDiv = document.createElement('div');
        sysDiv.classList.add('system-msg');
        sysDiv.innerText = msg.text;
        messagesBox.appendChild(sysDiv);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        return;
    }

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    
    // चेक करना कि क्या यह मैसेज इसी लॉगइन यूजर का है
    if (msg.username === userEmail) msgDiv.classList.add('mine');

    const displayTime = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : getCurrentTime();

    let contentHTML = `<span>${msg.text}</span>`;
    
    if (msg.image_url) {
        const fileUrl = msg.image_url;
        const lowerUrl = fileUrl.toLowerCase();
        
        if (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.gif') || lowerUrl.endsWith('.webp')) {
            contentHTML = `
                <img src="${fileUrl}" class="chat-image" alt="image" onclick="window.open('${fileUrl}', '_blank')" style="max-width:100%; border-radius:8px; cursor:pointer;">
                <div style="margin-top: 5px;">
                    <button onclick="window.copyToClipboard('${fileUrl}')" style="background:#2481cc; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">🔗 लिंक कॉपी करें</button>
                </div>
            `;
        } else {
            const fileName = msg.text || "डॉक्यूमेंट फाइल";
            contentHTML = `
                <div class="file-card" style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 5px;">
                    <span style="font-weight: bold; font-size: 13px; word-break: break-all;">📁 ${fileName}</span>
                    <div style="display: flex; gap: 8px; margin-top: 5px;">
                        <button onclick="window.open('${fileUrl}', '_blank')" style="background:#4CAF50; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:12px; cursor:pointer;">📥 डाउनलोड</button>
                        <button onclick="window.copyToClipboard('${fileUrl}')" style="background:#2481cc; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:12px; cursor:pointer;">🔗 लिंक कॉपी करें</button>
                    </div>
                </div>
            `;
        }
    }

    // यहाँ नाम की जगह यूजर की ईमेल आईडी दिखेगी
    msgDiv.innerHTML = `
        <div class="username" style="font-size:10px; color:rgba(0,0,0,0.4);">${msg.username || 'अनाम यूजर'}</div>
        <div class="msg-content">
            ${contentHTML}
            <span class="msg-time">${displayTime}</span>
        </div>
    `;
    
    messagesBox.appendChild(msgDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

// 🔍 रीयल-टाइम सर्च फंक्शन
if (searchFileInput) {
    searchFileInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        const allMessages = document.querySelectorAll('.message');

        allMessages.forEach(msgDiv => {
            const msgText = msgDiv.innerText.toLowerCase();
            if (msgText.includes(searchText)) {
                msgDiv.style.display = 'block';
            } else {
                msgDiv.style.display = 'none';
            }
        });
    });
}

// 5. टेक्स्ट मैसेज भेजना
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = '';
    emojiPicker.classList.add('hidden');

    const { error } = await supabaseClient
        .from('messages')
        .insert([{ username: userEmail, text }]);

    if (error) console.error("मैसेज भेजने में एरर:", error);
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

attachBtn.addEventListener('click', () => imageInput.click());

// 6. ऑल-फाइल अपलोड लॉजिक
imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    const originalName = file.name;
    messageInput.placeholder = "फाइल क्लाउड पर अपलोड हो रही है...";
    messageInput.disabled = true;

    try {
        const fileExt = originalName.split('.').pop();
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `chat-images/${fileName}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('chat-media')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseClient.storage
            .from('chat-media')
            .getPublicUrl(filePath);

        const { error: insertError } = await supabaseClient
            .from('messages')
            .insert([{ username: userEmail, text: originalName, image_url: publicUrl }]);

        if (insertError) throw insertError;

    } catch (err) {
        console.error("फाइल अपलोड फेल:", err);
        alert("फाइल अपलोड करने में समस्या आई!");
    } military {
        messageInput.placeholder = "एक संदेश लिखें...";
        messageInput.disabled = false;
        imageInput.value = '';
    }
});

// 7. पूरी चैट साफ़ करना
clearChatBtn.addEventListener('click', async () => {
    if (!confirm("क्या आप वाकई पूरी चैट साफ़ करना चाहते हैं?")) return;

    try {
        const { error } = await supabaseClient
            .from('messages')
            .delete()
            .neq('id', 0);

        if (error) throw error;

        await supabaseClient
            .from('messages')
            .insert([{ username: "System", text: `🧹 ${userEmail} द्वारा चैट साफ़ कर दी गई है।`, is_system: true }]);

    } catch (err) {
        console.error("चैट क्लियर एरर:", err);
    }
});

// 🌙 8. डार्क मोड टॉगल
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    if (document.body.classList.contains('dark')) {
        themeToggleBtn.innerText = '🌙';
    } else {
        themeToggleBtn.innerText = '☀️';
    }
});

// 😊 9. इमोजी कीबोर्ड
emojiBtn.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden');
});

document.querySelectorAll('.emoji-item').forEach(item => {
    item.addEventListener('click', (e) => {
        messageInput.value += e.target.innerText;
        messageInput.focus();
    });
});

messagesBox.addEventListener('click', () => {
    emojiPicker.classList.add('hidden');
});

// 10. रियल-टाइम लाइव अपडेट्स
function setupRealtime() {
    const chatChannel = supabaseClient.channel('public:messages', {
        config: { presence: { key: userEmail } }
    });

    chatChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
            if (payload.eventType === 'INSERT') {
                appendMessage(payload.new);
            } else if (payload.eventType === 'DELETE') {
                messagesBox.innerHTML = '';
                fetchMessages();
            }
        })
        .on('presence', { event: 'sync' }, () => {
            const newState = chatChannel.presenceState();
            const onlineCount = Object.keys(newState).length;
            chatStatus.innerText = `ऑनलाइन चैट रूम (${onlineCount} लाइव)`;
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await chatChannel.track({ online_at: new Date().toISOString() });
            }
        });
            }
