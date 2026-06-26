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

// 🔍 नए सर्च इनपुट बॉक्स को कनेक्ट किया
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

// 2. स्क्रीन पर मैसेज (टेक्स्ट या इमेज) दिखाना
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
    if (msg.image_url || (msg.text && msg.text.startsWith('http') && (msg.text.endsWith('.png') || msg.text.endsWith('.jpg') || msg.text.endsWith('.jpeg') || msg.text.endsWith('.gif')))) {
        const imgUrl = msg.image_url || msg.text;
        contentHTML = `<img src="${imgUrl}" class="chat-image" alt="image" onclick="window.open('${imgUrl}', '_blank')">`;
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

// 🔍 2.5 नया सर्च और फ़िल्टर फंक्शन (रीयल-टाइम सर्च के लिए)
if (searchFileInput) {
    searchFileInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        const allMessages = document.querySelectorAll('.message');

        allMessages.forEach(msgDiv => {
            const msgText = msgDiv.innerText.toLowerCase();
            // अगर सर्च टेक्स्ट मैसेज में मौजूद है तो दिखाओ, नहीं तो छिपा दो
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
    emojiPicker.classList.add('hidden'); // मैसेज भेजने पर कीबोर्ड बंद करें

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

// 4. इमेज अपलोड लॉजिक
imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    messageInput.placeholder = "इमेज अपलोड हो रही है...";
    messageInput.disabled = true;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
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
            .insert([{ username, text: "📷 फोटो भेजी गई", image_url: publicUrl }]);

        if (insertError) throw insertError;

    } catch (err) {
        console.error("इमेज अपलोड फेल:", err);
        alert("इमेज भेजने में समस्या आई!");
    } finally {
        messageInput.placeholder = "एक संदेश लिखें...";
        messageInput.disabled = false;
        imageInput.value = '';
    }
});

// 5. पूरी चैट साफ़ (Clear Chat) करने का लॉजिक
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

// 😊 7. इमोजी कीबोर्ड टॉगल और सिलेक्शन लॉजिक
emojiBtn.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden');
});

// जब कोई इमोजी पर क्लिक करे तो उसे इनपुट बॉक्स में जोड़ें
document.querySelectorAll('.emoji-item').forEach(item => {
    item.addEventListener('click', (e) => {
        messageInput.value += e.target.innerText;
        messageInput.focus(); // इनपुट बॉक्स पर कर्सर बनाए रखें
    });
});

// चैट बॉक्स पर क्लिक होने पर इमोजी पैनल अपने आप छिप जाए
messagesBox.addEventListener('click', () => {
    emojiPicker.classList.add('hidden');
});

// 8. रियल-टाइम लाइव चैटिंग और ऑनलाइन यूज़र्स ट्रैकिंग (Presence)
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
    
