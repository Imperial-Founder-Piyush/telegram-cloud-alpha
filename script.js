const SUPABASE_URL = "https://yixrieizgpptpzkohxpp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tmxQYeFiFfHIIxdLSe0v6A_kfEpvrvz";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let username = "";

const messagesBox = document.getElementById('messagesBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const usernameModal = document.getElementById('usernameModal');
const modalInput = document.getElementById('modalInput');
const joinBtn = document.getElementById('joinBtn');
const chatStatus = document.getElementById('chatStatus');
const clearChatBtn = document.getElementById('clearChatBtn');
const attachBtn = document.getElementById('attachBtn');
const imageInput = document.getElementById('imageInput');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const searchFileInput = document.getElementById('searchFileInput');

// यूज़र का नाम सेट करना और लाइव आना
function setUsername() {
    const enteredName = modalInput.value.trim();
    if (!enteredName) {
        alert("कृपया अपना नाम दर्ज करें!");
        return;
    }
    username = enteredName;
    usernameModal.style.display = 'none';
    
    fetchMessages();
    setupRealtime();
}

joinBtn.addEventListener('click', setUsername);
modalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setUsername();
});

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

// 1. पुराने मैसेजेस लोड करना
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

// 2. स्क्रीन पर मैसेज (टेक्स्ट, इमेज या ऑल-फाइल) दिखाना
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
    
    if (msg.username === username) msgDiv.classList.add('mine');

    const displayTime = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : getCurrentTime();

    let contentHTML = `<span>${msg.text}</span>`;
    
    // अगर कोई फाइल या इमेज की यूआरएल मौजूद है
    if (msg.image_url) {
        const fileUrl = msg.image_url;
        const lowerUrl = fileUrl.toLowerCase();
        
        // चेक करें कि क्या यह इमेज है
        if (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.gif') || lowerUrl.endsWith('.webp')) {
            contentHTML = `
                <img src="${fileUrl}" class="chat-image" alt="image" onclick="window.open('${fileUrl}', '_blank')" style="max-width:100%; border-radius:8px; cursor:pointer;">
                <div style="margin-top: 5px;">
                    <button onclick="window.copyToClipboard('${fileUrl}')" style="background:#2481cc; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">🔗 लिंक कॉपी करें</button>
                </div>
            `;
        } else {
            // इमेज के अलावा कोई भी फाइल (PDF, Video, ZIP) होने पर सुंदर डाउनलोड कार्ड दिखाएं
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

    msgDiv.innerHTML = `
        <div class="username">${msg.username}</div>
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

// 3. टेक्स्ट मैसेज भेजने का लॉजिक
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = '';
    emojiPicker.classList.add('hidden');

    const { error } = await supabaseClient
        .from('messages')
        .insert([{ username, text }]);

    if (error) console.error("मैसेज भेजने में एरर:", error);
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// प्लस बटन पर क्लिक करने पर फ़ाइल मैनेजर खोलें
attachBtn.addEventListener('click', () => imageInput.click());

// 4. ऑल-फाइल अपलोड लॉजिक (PDF, Video, Docs, etc.)
imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    const originalName = file.name;
    messageInput.placeholder = "फाइल क्लाउड पर अपलोड हो रही है...";
    messageInput.disabled = true;

    try {
        const fileExt = originalName.split('.').pop();
        // यूनिक नाम ताकि फाइलें आपस में ओवरराइट न हों
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `chat-images/${fileName}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('chat-media')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseClient.storage
            .from('chat-media')
            .getPublicUrl(filePath);

        // डेटाबेस में फाइल का नाम और उसकी लाइव लिंक सेव कर रहे हैं
        const { error: insertError } = await supabaseClient
            .from('messages')
            .insert([{ username, text: originalName, image_url: publicUrl }]);

        if (insertError) throw insertError;

    } catch (err) {
        console.error("फाइल अपलोड फेल:", err);
        alert("फाइल अपलोड करने में समस्या आई!");
    } finally {
        messageInput.placeholder = "एक संदेश लिखें...";
        messageInput.disabled = false;
        imageInput.value = '';
    }
});

// 5. पूरी चैट साफ़ करने का लॉजिक
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
            .insert([{ username: "System", text: `🧹 ${username} द्वारा चैट साफ़ कर दी गई है।`, is_system: true }]);

    } catch (err) {
        console.error("चैट क्लियर एरर:", err);
    }
});

// 🌙 6. डार्क मोड टॉगल लॉजिक
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    if (document.body.classList.contains('dark')) {
        themeToggleBtn.innerText = '🌙';
    } else {
        themeToggleBtn.innerText = '☀️';
    }
});

// 😊 7. इमोजी कीबोर्ड टॉगल
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

// 8. रियल-टाइम लाइव चैटिंग
function setupRealtime() {
    const chatChannel = supabaseClient.channel('public:messages', {
        config: { presence: { key: username } }
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
