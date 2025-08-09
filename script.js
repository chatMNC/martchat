document.addEventListener("DOMContentLoaded", function () {

const messageForm = document.querySelector(".prompt__form");
const chatContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");
const themeToggleButton = document.getElementById("themeToggler");
const voiceSelectionButton = document.createElement("button");
const voiceSelectDropdown = document.createElement("select");
const clearChatHistoryButton = document.querySelector(".h");
const notificationSound = new Audio("notification.mp3"); 
const loadingAnimationDisplayedSound = new Audio("notification.wav"); 
const UNSPLASH_ACCESS_KEY = "Cxqa_cB4mNydGAo5kvJ9fddOrPMQTZtM1pvqTX7srFQ";
const openrouter_api_key = "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";

let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];




// Function to add a message to the chat history
const addMessageToHistory = (role, content) => {
    chatHistory.push({ role, content });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    
};

clearChatHistoryButton.addEventListener("click", () => {
    chatHistory = [];
    localStorage.removeItem("chatHistory", JSON.stringify(chatHistory));
    alert("MartChat Memory Cleared!");
});


let voices = [];
let speechInstance = null;
let currentUserMessage = null;
let isGeneratingResponse = false;

const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
};

const fetchUnsplashImage = async (query) => {
    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&client_id=${UNSPLASH_ACCESS_KEY}`);
        if (!response.ok) throw new Error("Failed to fetch image.");
        
        const data = await response.json();
        notificationSound.play().catch(error => console.log("Sound play error:", error));
        return data.urls?.regular; 
    } catch (error) {
        console.error("Unsplash API error:", error);
        return null;
    }
};

voiceSelectionButton.innerHTML = `<abbr title="Change Voice"><i class='bx bxs-volume-full'></i></abbr>`; 
voiceSelectionButton.classList.add("voice-settings-btn"); 
voiceSelectDropdown.classList.add("voice-select");
document.body.appendChild(voiceSelectionButton);
document.body.appendChild(voiceSelectDropdown);

const loadVoices = () => {
    voices = speechSynthesis.getVoices();
    voiceSelectDropdown.innerHTML = ""; 

    voices.forEach((voice, index) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelectDropdown.appendChild(option);
    });

    const savedVoice = localStorage.getItem("selectedVoice");
    if (savedVoice) {
        voiceSelectDropdown.value = savedVoice;
    }
};

speechSynthesis.onvoiceschanged = loadVoices;

voiceSelectionButton.addEventListener("click", () => {
    voiceSelectDropdown.classList.toggle("show");
});

voiceSelectDropdown.addEventListener("change", () => {
    localStorage.setItem("selectedVoice", voiceSelectDropdown.value);
});

const regenerateResponse = async (incomingMessageElement) => {
    const messageTextElement = incomingMessageElement.querySelector(".message__text");

    if (!currentUserMessage) {
        console.error("User message is missing.");
        return;
    }

    const lowerCaseMessage = currentUserMessage.toLowerCase();

    // ✅ Handle predefined responses (Name, Introduction, Creator)
    if (["what is your name", "who are you"].some(q => lowerCaseMessage.includes(q))) {
        const botNameResponse = "My name is MartChat! Nice to meet you. 😊";
        showTypingEffect(botNameResponse, botNameResponse, messageTextElement, incomingMessageElement);
        return;
    }

    if (["introduce yourself", "tell me about yourself", "can you introduce yourself"].some(q => lowerCaseMessage.includes(q))) {
        const introductionResponse = `Hello! My name is MartChat. 🤖  
        I am a smart AI assistant designed to answer your questions, provide information, and engage in conversations.  
        I can help with coding, general knowledge, chatting, image display, and more! How can I assist you today? 😊`;
        showTypingEffect(introductionResponse, marked.parse(introductionResponse), messageTextElement, incomingMessageElement);
        return;
    }

    if (["who built you", "who created you", "who is your creator"].some(q => lowerCaseMessage.includes(q))) {
        const creatorResponse = `I was created by **Nwobodo Martins Chinemerem**, a developer from Abor in Udi Local Government Area, Enugu State, Nigeria. 🚀  
        He built me to be a smart AI assistant. How can I assist you today?`;
        showTypingEffect(creatorResponse, marked.parse(creatorResponse), messageTextElement, incomingMessageElement);
        return;
    }

    // ✅ Handle image request
    if (lowerCaseMessage.startsWith("show me an image of")) {
        const imageQuery = lowerCaseMessage.replace("show me an image of", "").trim();
        if (!imageQuery) {
            messageTextElement.innerText = "Please specify what you want to see. 😊";
            return;
        }

        try {
            const imageUrl = await fetchUnsplashImage(imageQuery);
            if (imageUrl) {
                messageTextElement.innerHTML = `<p>Here is an image of <strong>${imageQuery}</strong>: 📷</p>`;

                setTimeout(() => {
                    const imageContainer = document.createElement("div");
                    imageContainer.classList.add("image-container");

                    const imageElement = document.createElement("img");
                    imageElement.src = imageUrl;
                    imageElement.alt = imageQuery;
                    imageElement.classList.add("image-result");
                    imageElement.loading = "lazy";

                    const downloadButton = document.createElement("button");
                    downloadButton.classList.add("download-btn");
                    downloadButton.innerHTML = `<i class='bx bx-download'></i>`;

                    // ✅ Image Download Event
                    downloadButton.addEventListener("click", async () => {
                        try {
                            const response = await fetch(imageUrl);
                            const blob = await response.blob();
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = `${imageQuery}.jpg`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        } catch (error) {
                            console.error("Download failed:", error);
                            alert("Failed to download the image.");
                        }
                    });

                    imageContainer.append(imageElement, downloadButton);
                    messageTextElement.appendChild(imageContainer);
                }, 1000);
            } else {
                messageTextElement.innerText = "Sorry, I couldn't find an image for that.";
            }
        } catch (error) {
            console.error("Error fetching image:", error);
            messageTextElement.innerText = "Oops! Something went wrong while fetching the image.";
        }
        return;
    }

    // ✅ Clear previous bot response before regenerating
    messageTextElement.innerHTML = `Regenerating <div class="typing-indicator"><span></span><span></span><span></span></div>`;

    try {
        const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions"; 
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouter_api_key}`, // Use a backend proxy instead of exposing API key
                "Content-Type": "application/json",
                "HTTP-Referer": "https://yourdomain.com", // Replace with your actual domain
                "X-Title": "MartChat"
            },
            body: JSON.stringify({
                 model: "deepseek/deepseek-r1:free",
                messages: [{ role: "user", content: currentUserMessage }]
            }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const responseData = await response.json();
        const responseText = responseData.choices?.[0]?.message?.content || "No response received.";

        showTypingEffect(responseText, marked.parse(responseText), messageTextElement, incomingMessageElement);
    } catch (error) {
        console.error("Error regenerating response:", error);
        messageTextElement.innerText = "Failed to regenerate response. Please try again.";
    }
};

const readAloud = (text, buttonElement) => {
    if (!('speechSynthesis' in window)) {
        alert("Sorry, your browser does not support text-to-speech.");
        return;
    }

    if (speechInstance && speechSynthesis.speaking) {
        speechSynthesis.cancel();
        speechInstance = null;
        buttonElement.innerHTML = `<i class='bx bx-volume-full'></i>`; 
    }else {
        let cleanText = text
            .replace(/[*_~`#>\-]/g, '') 
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/!\[.*?\]\(.*?\)/g, ''); 

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = cleanText;
        cleanText = tempDiv.textContent || tempDiv.innerText;
        cleanText = cleanText.replace(/[\p{Emoji}]/gu, "");

        speechInstance = new SpeechSynthesisUtterance(cleanText);
        speechInstance.rate = 1;

        // Apply selected voice
        const selectedVoice = voiceSelectDropdown.value;
        const chosenVoice = voices.find(voice => voice.name === selectedVoice);
        if (chosenVoice) speechInstance.voice = chosenVoice;

        speechInstance.onend = () => {
            buttonElement.innerHTML = `<i class='bx bx-volume-full'></i>`; 
        };

        speechSynthesis.speak(speechInstance);
        buttonElement.innerHTML = `<i class='bx bx-volume-mute'></i>`; 
    }
};

const showTypingEffect = (rawText, htmlText, messageElement, incomingMessageElement, skipEffect = false) => {
    notificationSound.play().catch(error => console.log("Sound play error:", error));

    let typingIndicator = incomingMessageElement.querySelector(".typing-indicator");
    let regenerateButton = incomingMessageElement.querySelector(".regenerate-btn");
    let copyIconElement = incomingMessageElement.querySelector(".copy-btn");
    let readAloudIconElement = incomingMessageElement.querySelector(".read-aloud-btn");

    if (regenerateButton) regenerateButton.remove();

    regenerateButton = document.createElement("button");
    regenerateButton.innerHTML = `<i class='bx bx-refresh'></i>`;
    regenerateButton.classList.add("regenerate-btn", "hide");
    regenerateButton.onclick = () => regenerateResponse(incomingMessageElement);

    if (!readAloudIconElement) {
        readAloudIconElement = document.createElement("span");
        readAloudIconElement.classList.add("message__icon", "read-aloud-btn", "hide");
        readAloudIconElement.innerHTML = `<i class='bx bx-volume-full'></i>`;
    }

    readAloudIconElement.onclick = () => readAloud(rawText, readAloudIconElement);

    if (!copyIconElement) {
        copyIconElement = document.createElement("span");
        copyIconElement.classList.add("message__icon", "copy-btn", "hide");
        copyIconElement.innerHTML = `<i class='bx bx-copy'></i>`;
    }

    copyIconElement.onclick = function () {
        copyMessageToClipboard(htmlText, this); 
    };

    let existingDownloadButton = incomingMessageElement.querySelector(".download-btn");
    if (existingDownloadButton) existingDownloadButton.remove();

    const downloadResponseButton = document.createElement("button");
    downloadResponseButton.classList.add("download-btn", "hide");
    downloadResponseButton.innerHTML = `<i class='bx bx-download'></i>`;
    downloadResponseButton.addEventListener("click", () => {
        const blob = new Blob([rawText], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "MartChat_Response.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    if (!typingIndicator) {
        typingIndicator = document.createElement("div");
        typingIndicator.classList.add("typing-indicator");
        typingIndicator.innerHTML = `<span></span><span></span><span></span>`;
        incomingMessageElement.appendChild(typingIndicator);
    }

let buttonContainer = incomingMessageElement.querySelector(".button-container");
if (!buttonContainer) {
    buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");
    incomingMessageElement.appendChild(buttonContainer);
}

buttonContainer.appendChild(readAloudIconElement);
buttonContainer.appendChild(regenerateButton);
buttonContainer.appendChild(copyIconElement);
buttonContainer.appendChild(downloadResponseButton);

// ✅ Append timestamp at the end of the button row
const timestampElement = document.createElement("span");
timestampElement.classList.add("message__timestamp");
timestampElement.textContent = formatTimestamp();
buttonContainer.appendChild(timestampElement);


    if (skipEffect) {
        messageElement.innerHTML = htmlText;

         if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([messageElement])
                .catch(err => console.error("MathJax render error:", err));
        }
        hljs.highlightAll();
        addCopyButtonToCodeBlocks();
        copyIconElement.classList.remove("hide");
        readAloudIconElement.classList.remove("hide");
        regenerateButton.classList.remove("hide");
        downloadResponseButton.classList.remove("hide");
        removeTypingIndicator(incomingMessageElement);
        return;
    }

    const chars = rawText.split("");
    let charIndex = 0;
    messageElement.innerText = "";

    const typingInterval = setInterval(() => {
        messageElement.innerText += chars[charIndex] || '';
        charIndex++;

        if (charIndex === chars.length) {
            clearInterval(typingInterval);
            isGeneratingResponse = false;
            messageElement.innerHTML = htmlText;

            document.querySelectorAll("pre code").forEach((block) => {
                hljs.highlightElement(block);
            });


             // ✅ Render Math
        if (window.MathJax && window.MathJax.typesetPromise) {
             MathJax.typesetPromise([messageElement]).catch(err => console.error("MathJax error:", err));
        }

            addCopyButtonToCodeBlocks();
            copyIconElement.classList.remove("hide");
            regenerateButton.classList.remove("hide");
            readAloudIconElement.classList.remove("hide");
            downloadResponseButton.classList.remove("hide");
            addMessageToHistory("bot", rawText);
            removeTypingIndicator(incomingMessageElement);
        }
    }, -19); // Adjust this speed for typing feel (20–40 ms is good)
};




const copyMessageToClipboard = (text, buttonElement) => {
    if (!text || !buttonElement) return;
    navigator.clipboard.writeText(text).then(() => {
        buttonElement.innerHTML = `<i class='bx bx-check'></i>`; 
        setTimeout(() => buttonElement.innerHTML = `<i class='bx bx-copy'></i>`, 2000); 
    }).catch(err => console.error("Failed to copy: ", err));
};

function removeTypingIndicator(parentElement) {
    const typingIndicator = parentElement.querySelector(".typing-indicator");
    if (typingIndicator) {
        parentElement.removeChild(typingIndicator);
    }
}

const getResponseFromOpenRouters = async (incomingMessageElement) => {
    const messageTextElement = incomingMessageElement.querySelector(".message__text");

    try {
        if (!currentUserMessage) throw new Error("User message is missing.");
        const lowerCaseMessage = currentUserMessage.toLowerCase();
        isGeneratingResponse = true;

        // ✅ Handle bot introduction
        if (["what is your name", "who are you"].some(q => lowerCaseMessage.includes(q))) {
            const botNameResponse = "My name is MartChat! Nice to meet you. 😊";
            showTypingEffect(botNameResponse, botNameResponse, messageTextElement, incomingMessageElement);
            return;
        }

        // ✅ Handle self-introduction
        if (["introduce yourself", "tell me about yourself", "can you introduce yourself"].some(q => lowerCaseMessage.includes(q))) {
            const introductionResponse = `Hello! My name is MartChat. 🤖  
            I am a smart AI assistant designed to answer your questions, provide information, and engage in conversations.  
            I can help with coding, general knowledge, chatting, image display, and more! How can I assist you today? 😊`;
            showTypingEffect(introductionResponse, marked.parse(introductionResponse), messageTextElement, incomingMessageElement);
            return;
        }

        // ✅ Handle creator question
        if (["who built you", "who created you", "who is your creator"].some(q => lowerCaseMessage.includes(q))) {
            const creatorResponse = `I was created by **Nwobodo Martins Chinemerem**, a developer from Abor in Udi Local Government Area, Enugu State, Nigeria. 🚀  
            He built me to be a smart AI assistant. How can I assist you today?`;
            showTypingEffect(creatorResponse, marked.parse(creatorResponse), messageTextElement, incomingMessageElement);
            return;
        }

        // ✅ Handle image request
        if (lowerCaseMessage.startsWith("show me an image of")) {
            const imageQuery = lowerCaseMessage.replace("show me an image of", "").trim();
            if (!imageQuery) {
                messageTextElement.innerText = "Please specify what you want to see. 😊";
                return;
            }

            try {
                const imageUrl = await fetchUnsplashImage(imageQuery);
                if (imageUrl) {
                    messageTextElement.innerHTML = `<p>Here is an image of <strong>${imageQuery}</strong>: 📷</p>`;

                    setTimeout(() => {
                        const imageContainer = document.createElement("div");
                        imageContainer.classList.add("image-container");

                        const imageElement = document.createElement("img");
                        imageElement.src = imageUrl;
                        imageElement.alt = imageQuery;
                        imageElement.classList.add("image-result");
                        imageElement.loading = "lazy";

                        const downloadButton = document.createElement("button");
                        downloadButton.classList.add("download-btn");
                        downloadButton.innerHTML = `<i class='bx bx-download'></i>`;

                        // ✅ Image Download Event
                        downloadButton.addEventListener("click", async () => {
                            try {
                                const response = await fetch(imageUrl);
                                const blob = await response.blob();
                                const a = document.createElement("a");
                                a.href = URL.createObjectURL(blob);
                                a.download = `${imageQuery}.jpg`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            } catch (error) {
                                console.error("Download failed:", error);
                                alert("Failed to download the image.");
                            }
                        });

                        imageContainer.append(imageElement, downloadButton);
                        messageTextElement.appendChild(imageContainer);
                    }, 1000);
                } else {
                    messageTextElement.innerText = "Sorry, I couldn't find an image for that.";
                }
            } catch (error) {
                console.error("Error fetching image:", error);
                messageTextElement.innerText = "Oops! Something went wrong while fetching the image.";
            }
            return;
        }

        let responseText = "";

        if (isOnlineMode) {
            // ✅ Online mode: Use OpenRouter
            const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openrouter_api_key}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://yourdomain.com",
                    "X-Title": "MartChat"
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-r1:free",
                    messages: chatHistory.map((msg) => ({
                        role: msg.role === "user" ? "user" : "assistant",
                        content: msg.content
                    }))
                })
            });
        
            if (!response.ok) throw new Error(await response.text() || "Error While fetching response.");
            const responseData = await response.json();
            responseText = responseData.choices?.[0]?.message?.content || "No response received to your message.";
        } else {
            // ✅ Offline mode: Use Ollama (make sure Ollama is running locally)
            const response = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama3", // Replace with your running Ollama model
                    prompt: currentUserMessage,
                    stream: false
                })
            });
        
            const responseData = await response.json();
            responseText = responseData.response || "No response received to your message.";
        }
        

        showTypingEffect(responseText, marked.parse(responseText), messageTextElement, incomingMessageElement);
        console.log(responseText);
    } catch (error) {
    console.error("Chat error:", error);
    messageTextElement.innerText = "Oops! Something went wrong. Please try again later.";
    messageTextElement.closest(".message").classList.add("message--error");
}
 finally {
        isGeneratingResponse = false;
        incomingMessageElement.classList.remove("message--loading");
    }
};


let isOnlineMode = true;

const responseModeToggle = document.createElement("button");
responseModeToggle.classList.add("mode-toggle-btn");
responseModeToggle.textContent = "Mode: Online 🌐";
document.body.appendChild(responseModeToggle);

responseModeToggle.addEventListener("click", () => {
    isOnlineMode = !isOnlineMode;
    responseModeToggle.textContent = isOnlineMode ? "Mode: Online 🌐" : "Mode: Offline 🖥️";
});


const displayLoadingAnimation = () => {
    const loadingHtml = `

        <div class="message__content">
            <img class="message__avatar" src="app.png" alt="Ollama avatar">
            <p class="message__text"></p>
            <div class="message__loading-indicator">
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
            </div>
        </div>
        <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
    
    `;

    const loadingMessageElement = createChatMessageElement(loadingHtml, "message--incoming", "message--loading");
    chatContainer.appendChild(loadingMessageElement);
    loadingAnimationDisplayedSound.play().catch(error => console.log("Sound play error:", error));

    getResponseFromOpenRouters(loadingMessageElement);
};

// formatTimestamp is down here (after handleOutgoingMessage)
const formatTimestamp = (date = new Date()) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


const handleOutgoingMessage = () => {
    const userText = messageForm.querySelector(".prompt__form-input").value.trim();
    const wordCount = userText.split(/\s+/).length; // Split by spaces and count words
    if (wordCount > 550) {
        readAloud("Your message is too long!, can you please shorten the expression", "error");
        return;
    }

    if (isGeneratingResponse) {
        readAloud("Please wait for a litttle while I'm working on your request", "error");;
        return;
    }
    
        currentUserMessage = userText;


    // Create and append the outgoing message element as before
    const outgoingMessageHtml = `
    <div class="message__content">
        <img class="message__avatar" src="profile.jpg" alt="User avatar">
        <div>
            <p class="message__text"></p>
            <span class="message__timestamp">${formatTimestamp()}</span>
        </div>
    </div>
`;



    const outgoingMessageElement = createChatMessageElement(outgoingMessageHtml, "message--outgoing");
    outgoingMessageElement.querySelector(".message__text").innerText = userText;
    chatContainer.appendChild(outgoingMessageElement);

    addMessageToHistory("user", currentUserMessage);

    // Reset form and clear file preview
    messageForm.reset();

    document.body.classList.add("hide-header");
    setTimeout(displayLoadingAnimation, 500);
};



const addCopyButtonToCodeBlocks = () => {
    const codeBlocks = document.querySelectorAll('pre');

    codeBlocks.forEach((block) => {
        // Skip if already has a copy button
        if (block.querySelector('.code__copy-btn')) return;

        const codeElement = block.querySelector('code');
        if (!codeElement) return;

        // Create header bar
        const header = document.createElement('div');
        header.classList.add('code__header');

        const language = [...codeElement.classList].find(cls => cls.startsWith('language-'))?.replace('language-', '') || 'Text';
        const languageLabel = document.createElement('div');
        languageLabel.classList.add('code__language-label');
        languageLabel.textContent = language.charAt(0).toUpperCase() + language.slice(1);

        const copyButton = document.createElement('button');
        copyButton.classList.add('code__copy-btn');
        copyButton.innerHTML = `<i class='bx bx-copy'></i>`;

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(codeElement.innerText).then(() => {
                copyButton.innerHTML = `<i class='bx bx-check'></i>`;
                setTimeout(() => copyButton.innerHTML = `<i class='bx bx-copy'></i>`, 2000);
            }).catch(err => {
                console.error("Copy failed:", err);
                alert("Unable to copy text!");
            });
        });

        header.appendChild(languageLabel);
        header.appendChild(copyButton);
        block.insertBefore(header, codeElement);
    });
};


themeToggleButton.addEventListener('click', () => {
    const isLightTheme = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");

    const newIconClass = isLightTheme ? "bx bx-moon" : "bx bx-sun";
    themeToggleButton.querySelector("i").className = newIconClass;
});

suggestionItems.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        const suggestionText = suggestion.querySelector(".suggests__item-text").innerText;
        currentUserMessage = suggestionText;
        document.querySelector(".prompt__form-input").value = suggestionText;
        handleOutgoingMessage();
    });
});


messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

window.addEventListener("beforeunload", () => {
    speechSynthesis.cancel();
});

const micButton = document.getElementById("micButton");
const messageInput = document.querySelector(".prompt__form-input");
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (window.SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US"; 

    let isRecording = false; 

    micButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    });


    micButton.addEventListener("click", () => {
        if (!isRecording) {
            recognition.start();
            isRecording = true;
            micButton.innerHTML = `<i class='bx bx-stop'></i>`; 
            micButton.classList.add("recording");
        } else {
            recognition.stop();
            isRecording = false;
            micButton.innerHTML = `<i class='bx bx-microphone'></i>`; 
            micButton.classList.remove("recording");
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
    };

    recognition.onspeechend = () => {
        recognition.stop();
        isRecording = false;
        micButton.innerHTML = `<i class='bx bx-microphone'></i>`;
        micButton.classList.remove("recording");
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert("Speech recognition failed. Try again.");
        isRecording = false;
        micButton.innerHTML = `<i class='bx bx-microphone'></i>`;
        micButton.classList.remove("recording");
    };
} else {
    micButton.style.display = "none"; 
}
});

const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");

function checkScrollbar() {
    // Check if the content height is greater than the window height
    if (document.body.scrollHeight > window.innerHeight) {
        scrollToBottomBtn.style.display = "flex"; // Show button if content requires scrolling
    } else {
        scrollToBottomBtn.style.display = "none"; // Hide button if no scrolling is needed
    }
}

function scrollToBottom() {
    // Scroll smoothly to the bottom of the page
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    scrollToBottomBtn.style.display = "none"; // Hide button after scrolling
}
function hideButtonOnScroll() {
    // Check if the user has scrolled to the bottom of the page
    if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight) {
        scrollToBottomBtn.style.display = "none"; // Hide button if at the bottom
    }
}
scrollToBottomBtn.addEventListener("click", scrollToBottom);

   
window.addEventListener("resize", checkScrollbar); 
window.addEventListener("scroll", function() {
    checkScrollbar(); // Recheck if scrollbar exists
    hideButtonOnScroll(); // Hide button when scrolled to the bottom
});
    checkScrollbar(); // Initial check when the page loads
