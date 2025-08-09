
document.addEventListener('keydown', function (e) {
    // Disable 'Ctrl + U' and 'Command + Option + U'
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 85) {
        e.preventDefault();  // Prevent 'Ctrl + U' or 'Command + Option + U'
        alert('Viewing the source code is disabled on this page!');
    }

    // Disable 'Ctrl + Shift + I' / 'Command + Option + I' (Dev Tools)
    if ((e.ctrlKey && e.shiftKey && e.keyCode === 73) || (e.metaKey && e.shiftKey && e.keyCode === 73)) {
        e.preventDefault();  // Prevent 'Ctrl + Shift + I' / 'Command + Option + I'
        alert('Developer tools are disabled on this page!');
    }

    // Disable 'F12' (Dev Tools)
    if (e.keyCode === 123) {
        e.preventDefault();  // Prevent 'F12' (Dev Tools)
        alert('Developer tools are disabled on this page!');
    }

    // Disable 'Ctrl + Shift + J' / 'Command + Option + J' (Console)
    if ((e.ctrlKey && e.shiftKey && e.keyCode === 74) || (e.metaKey && e.shiftKey && e.keyCode === 74)) {
        e.preventDefault();  // Prevent 'Ctrl + Shift + J' / 'Command + Option + J'
        alert('Developer tools are disabled on this page!');
    }

    // Disable 'Ctrl + Shift + C' / 'Command + Option + C' (Elements)
    if ((e.ctrlKey && e.shiftKey && e.keyCode === 67) || (e.metaKey && e.shiftKey && e.keyCode === 67)) {
        e.preventDefault();  // Prevent 'Ctrl + Shift + C' / 'Command + Option + C'
        alert('Developer tools are disabled on this page!');
    }
});


const suggestionsData = [
    { text: "What is the full definition of a plateau in geology?", icon: "bx bx-planet" },
    { text: "Write Basic Python code for building a chatbot using the Flask framework", icon: "bx bx-code-alt" },
    { text: "Help me write a poem about a sunset over the ocean with a lighthouse in the background", icon: "bx bx-moon" },
    { text: "Give me a list of 5 things to do in New York City", icon: "bx bx-map" },
    { text: "Show me an image of a cat", icon: "bx bx-image" },
    { text: "Explain the difference between HTTP and HTTPS", icon: "bx bx-globe" },
    { text: "Generate a random trivia fact", icon: "bx bx-question-mark" },
    { text: "How do black holes form?", icon: "bx bx-black-hole" },
    { text: "Give me 3 ideas for a science fiction story", icon: "bx bx-book-open" },
    { text: "Summarize the book 'Atomic Habits' by James Clear", icon: "bx bx-book" },
    { text: "Translate 'Hello, how are you?' into Spanish", icon: "bx bx-globe-alt" },
    { text: "What are the health benefits of drinking green tea?", icon: "bx bx-leaf" },
    { text: "Build a simple HTML contact form with validation", icon: "bx bx-code" },
    { text: "Write a joke about robots", icon: "bx bx-happy-alt" },
    { text: "Describe the water cycle in simple terms", icon: "bx bx-droplet" },
    { text: "Tell me a motivational quote", icon: "bx bx-bulb" },
    { text: "List the planets in our solar system in order", icon: "bx bx-sun" },
    { text: "What does 'machine learning' mean?", icon: "bx bx-brain" },
    { text: "Give a short biography of Elon Musk", icon: "bx bx-user" },
    { text: "Create a morning routine for productivity", icon: "bx bx-time" },
    { text: "What are the 7 wonders of the world?", icon: "bx bx-world" },
    { text: "What causes earthquakes?", icon: "bx bx-pulse" },
    { text: "Create a CSS animation for a bouncing ball", icon: "bx bx-bounce" },
    { text: "Write a story about a lost treasure in the jungle", icon: "bx bx-compass" },
    { text: "What are some fun facts about dolphins?", icon: "bx bx-water" },
    { text: "Explain photosynthesis like I'm 10 years old", icon: "bx bx-leaf" },
    { text: "What is the Pythagorean theorem?", icon: "bx bx-math" },
    { text: "Suggest a recipe using only 3 ingredients", icon: "bx bx-bowl-hot" },
    { text: "List the top 5 programming languages in 2024", icon: "bx bx-terminal" },
    { text: "Give me tips to reduce screen time", icon: "bx bx-mobile" }
];



const generateRandomSuggestions = (count = 5) => {
    const shuffled = [...suggestionsData].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const suggestionContainer = document.getElementById("suggestContainer");

generateRandomSuggestions().forEach(({ text, icon }) => {
    const item = document.createElement("div");
    item.classList.add("suggests__item");
    item.innerHTML = `
        <p class="suggests__item-text">${text}</p>
        <div class="suggests__item-icon"><i class='${icon}'></i></div>
    `;
    suggestionContainer.appendChild(item);

    item.addEventListener("click", () => {
        currentUserMessage = text;
        document.querySelector(".prompt__form-input").value = text;
        handleOutgoingMessage();
    });
});
