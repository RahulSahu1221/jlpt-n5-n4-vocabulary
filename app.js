const $ = id => document.getElementById(id);

const OPTION_IDS = [
    "optionA",
    "optionB",
    "optionC",
    "optionD"
];

const header =
    document.querySelector("header");

// --------------------------------------------------
// ACTIVE NAV STATE
// --------------------------------------------------

const NAV_BTNS = ["vocabBtn","flashcardBtn","quizBtn","favBtn"];

function setActiveNav(activeId) {
    NAV_BTNS.forEach(id => {
        $(id).classList.toggle("active-nav", id === activeId);
    });
}


let vocabulary = [];
let filteredVocabulary = [];

const vocabularyContainer =  $("vocabularyContainer");
const lessonSelect =  $("lessonSelect");
const searchBox =  $("searchBox");

const vocabularyView =  $("vocabularyView");
const flashcardView =  $("flashcardView");
const quizView =  $("quizView");

const lessonTitle =  $("lessonTitle");

const flashFront =  $("flashFront");
const flashBack =  $("flashBack");
const flashcard =  $("flashcard");

const progressFill =  $("progressFill");

let flashcardIndex = 0;
let flashcardShowingBack = false;

function updateCardCounter() {

     $("cardCounter").textContent =
        `${flashcardIndex + 1} / ${vocabulary.length}`;

     $("prevBtn").disabled =
        flashcardIndex === 0;

     $("nextBtn").disabled =
        flashcardIndex === vocabulary.length - 1;
}

let quizWord = null;
let quizMode = "kanjiToMeaning"; // or "meaningToKanji"

let score = 0;
let streak = 0;
let bestStreak = 0;
let questionNumber = 0;

let quizReport = [];
const totalQuestions = 20;




// --------------------------------------------------
// FAVORITES & LEARNED (localStorage)
// --------------------------------------------------

function getFavorites() {
    return JSON.parse(localStorage.getItem("jlpt_favorites") || "[]");
}

function toggleFavorite(kanji) {
    let favs = getFavorites();
    if (favs.includes(kanji)) {
        favs = favs.filter(k => k !== kanji);
    } else {
        favs.push(kanji);
    }
    localStorage.setItem("jlpt_favorites", JSON.stringify(favs));
}

function isFavorite(kanji) {
    return getFavorites().includes(kanji);
}

function getLearned() {
    return JSON.parse(localStorage.getItem("jlpt_learned") || "[]");
}

function toggleLearned(kanji) {
    let learned = getLearned();
    if (learned.includes(kanji)) {
        learned = learned.filter(k => k !== kanji);
    } else {
        learned.push(kanji);
    }
    localStorage.setItem("jlpt_learned", JSON.stringify(learned));
}

function isLearned(kanji) {
    return getLearned().includes(kanji);
}




// --------------------------------------------------
// EMOJI GENERATOR
// --------------------------------------------------

function getEmoji(word, meaning) {

    const text = (word + " " + meaning).toLowerCase();

    if(text.includes("space")) return "🚀";
    if(text.includes("astronaut")) return "👨‍🚀";
    if(text.includes("hospital")) return "🏥";
    if(text.includes("school")) return "🏫";
    if(text.includes("train")) return "🚆";
    if(text.includes("car")) return "🚗";
    if(text.includes("bird")) return "🐦";
    if(text.includes("dog")) return "🐶";
    if(text.includes("cat")) return "🐱";
    if(text.includes("book")) return "📖";
    if(text.includes("telephone")) return "☎️";
    if(text.includes("money")) return "💴";
    if(text.includes("letter")) return "✉️";
    if(text.includes("mail")) return "📧";
    if(text.includes("flower")) return "🌸";
    if(text.includes("tree")) return "🌳";
    if(text.includes("water")) return "💧";
    if(text.includes("rain")) return "🌧️";
    if(text.includes("sun")) return "☀️";
    if(text.includes("moon")) return "🌙";
    if(text.includes("mountain")) return "⛰️";
    if(text.includes("fire")) return "🔥";
    if(text.includes("dance")) return "💃";
    if(text.includes("search")) return "🔍";
    if(text.includes("study")) return "📚";
    if(text.includes("music")) return "🎵";
    if(text.includes("sports")) return "🏅";

    return "📘";
}
function getVisual(item){

    return item.image
        ?
        `<img
            src="${item.image}"
            alt="${item.meaning}"
            class="vocab-image"
        >`
        :
        (
            item.emoji ||
            getEmoji(
                item.kanji,
                item.meaning
            )
        );
}

// --------------------------------------------------
// LOAD LESSON
// --------------------------------------------------

async function loadLesson(lessonNumber) {

    try {

        // Fade out
        vocabularyContainer.classList.add("fading");

        await new Promise(r => setTimeout(r, 200));

        const response =
            await fetch(`data/lesson${lessonNumber}.json`);

        vocabulary = await response.json();

        filteredVocabulary = [...vocabulary];

        lessonTitle.textContent =
            `Lesson ${lessonNumber}`;

        renderVocabulary();

        updateProgress();

        // Fade in
        vocabularyContainer.classList.remove("fading");

    } catch(error) {

        vocabularyContainer.classList.remove("fading");

        console.error(error);

        vocabularyContainer.innerHTML = `
            <h2>
                lesson${lessonNumber}.json not found
            </h2>
        `;
    }
}

// --------------------------------------------------
// RENDER VOCAB
// --------------------------------------------------

function renderVocabulary() {

    vocabularyContainer.innerHTML = "";

    if (filteredVocabulary.length === 0) {
        vocabularyContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⭐</div>
                <div class="empty-state-title">No favorites yet</div>
                <div class="empty-state-sub">Star words from the Vocabulary view to collect them here.</div>
            </div>`;
        return;
    }

    const grouped = {};

    filteredVocabulary.forEach(item => {

        const section =
            item.section ||
            item.category ||
            "Others";

        if(!grouped[section]) {

            grouped[section] = [];
        }

        grouped[section].push(item);
    });

    let cardIndex = 0;

    Object.entries(grouped).forEach(
    ([section, items]) => {

        const heading =
            document.createElement("h2");

        heading.className =
            "section-heading";

        heading.textContent =
            section;

        vocabularyContainer.appendChild(
            heading
        );

        items.forEach(item => {

            const card =
                document.createElement("div");

            card.className = "card";
            card.style.setProperty("--card-i", Math.min(cardIndex, 20));
            cardIndex++;

            card.innerHTML = `

                ${isLearned(item.kanji) ? '<span class="learned-badge">✅ Learned</span>' : ''}

                <div class="emoji">

                ${getVisual(item)}

                </div>

                <div class="kanji">
                    ${item.kanji}
                </div>

                <div class="hiragana">
                    ${item.hiragana}
                </div>

                <div class="meaning">
                    ${item.meaning}
                </div>

                <div class="card-details">

                <div class="memory">
                    ${item.memory || ""}
                </div>

                <div class="example">
                    ${item.example || ""}
                </div>

                <div class="translation">
                    ${item.translation || ""}
                </div>





                <div class="actions">

                    <button
                        class="speak-btn"
                        onclick="speakJapanese('${item.hiragana}')"
                    >
                        🔊
                    </button>

                    <button
                        class="favorite-btn ${isFavorite(item.kanji) ? 'favorited' : ''}"
                        onclick="animFavorite(this, '${item.kanji}')"
                        title="Add to Favorites"
                    >
                        ${isFavorite(item.kanji) ? '⭐' : '☆'}
                    </button>

                    <button
                        class="learned-btn ${isLearned(item.kanji) ? 'is-learned' : ''}"
                        onclick="animLearned(this, '${item.kanji}')"
                        title="Mark as Learned"
                    >
                        ${isLearned(item.kanji) ? '✅ Learned' : '📌 Mark'}
                    </button>

                </div>

                </div>
            `;




            vocabularyContainer.appendChild(
                card
            );
        });
    });

    requestAnimationFrame(observeCards);
}

// --------------------------------------------------
// SCROLL REVEAL + 3D TILT + PARTICLES
// --------------------------------------------------

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });

function observeCards() {
    document.querySelectorAll(".card:not(.revealed)").forEach(card => {
        revealObserver.observe(card);
    });
}

// 3D magnetic tilt on vocab cards
document.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".card");
    if (!card) {
        // reset any previously tilted card
        if (window._lastTiltCard) {
            window._lastTiltCard.style.transform = "";
            window._lastTiltCard = null;
        }
        return;
    }
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rotX =  dy * -7;
    const rotY =  dx *  7;
    card.style.transform = `translateY(-5px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    window._lastTiltCard = card;
});

document.addEventListener("mouseleave", () => {
    if (window._lastTiltCard) {
        window._lastTiltCard.style.transform = "";
        window._lastTiltCard = null;
    }
}, true);

// Particle burst helper
function burstParticles(x, y, color) {
    const count = 10;
    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        const angle = (i / count) * 360;
        const dist  = 40 + Math.random() * 40;
        const tx = Math.cos(angle * Math.PI / 180) * dist;
        const ty = Math.sin(angle * Math.PI / 180) * dist;
        const size = 5 + Math.random() * 5;
        p.style.cssText = `
            left:${x}px; top:${y}px;
            width:${size}px; height:${size}px;
            background:${color};
            --tx:${tx}px; --ty:${ty}px;
            --dur:${0.5 + Math.random() * 0.4}s;
        `;
        document.body.appendChild(p);
        p.addEventListener("animationend", () => p.remove());
    }
}

// --------------------------------------------------
// BUTTON ANIMATION HELPERS
// --------------------------------------------------

function animFavorite(btn, kanji) {
    btn.classList.remove("spin-anim");
    void btn.offsetWidth; // reflow to restart
    btn.classList.add("spin-anim");
    const r = btn.getBoundingClientRect();
    const isFav = !isFavorite(kanji);
    burstParticles(r.left + r.width/2, r.top + r.height/2, isFav ? "#f7c948" : "#7a8ba3");
    toggleFavorite(kanji);
    renderVocabulary();
}

function animLearned(btn, kanji) {
    const willLearn = !isLearned(kanji);
    toggleLearned(kanji);
    renderVocabulary();
    if (willLearn) {
        // stamp the badge after re-render
        requestAnimationFrame(() => {
            const badge = btn.closest(".card") && btn.closest(".card").querySelector(".learned-badge");
            if (badge) badge.classList.add("stamp-anim");
            const r = btn.getBoundingClientRect();
            burstParticles(r.left + r.width/2, r.top + r.height/2, "#43d98c");
        });
    }
}

// --------------------------------------------------
// SPEECH
// --------------------------------------------------

function speakJapanese(text) {

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "ja-JP";

    speechSynthesis.speak(utterance);
}

// --------------------------------------------------
// SEARCH
// --------------------------------------------------

searchBox.addEventListener("input", () => {

    const query =
        searchBox.value.toLowerCase();

    filteredVocabulary =
        vocabulary.filter(item =>

            (item.kanji || "")
            .toLowerCase()
            .includes(query)

            ||

            (item.hiragana || "")
            .toLowerCase()
            .includes(query)

            ||

            (item.meaning || "")
            .toLowerCase()
            .includes(query)

        );

    renderVocabulary();
});

// --------------------------------------------------
// LESSON CHANGE
// --------------------------------------------------

lessonSelect.addEventListener("change", () => {

    loadLesson(lessonSelect.value);
});

// --------------------------------------------------
// FLASHCARD
// --------------------------------------------------

$("flashcardBtn")
.addEventListener("click", () => {

    vocabularyView.classList.add("hidden");
    quizView.classList.add("hidden");

    flashcardView.classList.remove("hidden");
    flashcardView.classList.remove("view-enter"); void flashcardView.offsetWidth; flashcardView.classList.add("view-enter");

    setActiveNav("flashcardBtn");

    startFlashcard();
});

function startFlashcard() {

    if(vocabulary.length === 0) return;

    flashcardIndex = 0;

    showFlashcard();
}

function showFlashcard() {

    const word = vocabulary[flashcardIndex];

    flashcard.innerHTML = `
        <div class="flashcard-inner">
            <div class="flash-face front-face">
                <div style="font-size:40px">${getVisual(word)}</div>
                <div class="kanji" style="margin-top:16px">${word.kanji}</div>
                <div style="color:#aab4c3;font-size:13px;margin-top:10px">tap to flip</div>
            </div>
            <div class="flash-face back-face">
                <h2 style="color:#72d6c9">${word.hiragana}</h2>
                <div class="meaning" style="margin-top:12px;font-size:20px">${word.meaning}</div>
                <div class="memory" style="margin-top:10px">${word.memory || ""}</div>
            </div>
        </div>
    `;

    flashcard.classList.remove("flipped");
    flashcardShowingBack = false;

    updateCardCounter();
    updateFlashcardDots();
}

function updateFlashcardDots() {
    let dotsEl = document.querySelector(".flashcard-dots");
    if (!dotsEl) {
        dotsEl = document.createElement("div");
        dotsEl.className = "flashcard-dots";
        const nav = document.querySelector(".flashcard-navigation");
        if (nav) nav.parentNode.insertBefore(dotsEl, nav);
    }
    // Only show dots if <= 30 cards (avoid overflow)
    if (vocabulary.length > 30) { dotsEl.style.display = "none"; return; }
    dotsEl.style.display = "flex";
    dotsEl.innerHTML = "";
    vocabulary.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.className = "fc-dot" +
            (i === flashcardIndex ? " active" : "") +
            (i < flashcardIndex  ? " seen"   : "");
        dot.addEventListener("click", () => {
            const dir = i > flashcardIndex ? "left" : "right";
            slideFlashcard(dir, () => { flashcardIndex = i; showFlashcard(); });
        });
        dotsEl.appendChild(dot);
    });
}

flashcard.addEventListener("click", () => {

    flashcard.classList.toggle("flipped");
    flashcardShowingBack = !flashcardShowingBack;

});

$("prevBtn")
.addEventListener("click", () => {
    if(flashcardIndex > 0) {
        slideFlashcard("right", () => { flashcardIndex--; showFlashcard(); });
    }
});

$("nextBtn")
.addEventListener("click", () => {
    if(flashcardIndex < vocabulary.length - 1) {
        slideFlashcard("left", () => { flashcardIndex++; showFlashcard(); });
    }
});

function slideFlashcard(direction, callback) {
    const outClass = direction === "left" ? "slide-out-left" : "slide-out-right";
    const inClass  = direction === "left" ? "slide-in-left"  : "slide-in-right";
    flashcard.classList.add(outClass);
    flashcard.addEventListener("animationend", () => {
        flashcard.classList.remove(outClass);
        callback();
        requestAnimationFrame(() => {
            flashcard.classList.add(inClass);
            flashcard.addEventListener("animationend", () => {
                flashcard.classList.remove(inClass);
            }, { once: true });
        });
    }, { once: true });
}

document.addEventListener("keydown", (e) => {

    if(flashcardView.classList.contains("hidden") &&
       quizView.classList.contains("hidden"))
        return;

    // Flashcard keyboard nav
    if(!flashcardView.classList.contains("hidden")) {
        if(e.key === "ArrowLeft") {
            e.preventDefault();
            if(flashcardIndex > 0) slideFlashcard("right", () => { flashcardIndex--; showFlashcard(); });
        }
        if(e.key === "ArrowRight") {
            e.preventDefault();
            if(flashcardIndex < vocabulary.length - 1) slideFlashcard("left", () => { flashcardIndex++; showFlashcard(); });
        }
        if(e.key === " " || e.key === "Enter") {
            e.preventDefault();
            flashcard.click();
        }
    }

    // Quiz keyboard nav: 1-4 to pick answer
    if(!quizView.classList.contains("hidden")) {
        const map = { "1": "optionA", "2": "optionB", "3": "optionC", "4": "optionD" };
        if(map[e.key]) {
            const btn = $(map[e.key]);
            if(btn && !btn.disabled) btn.click();
        }
    }

});


// --------------------------------------------------
// QUIZ
// --------------------------------------------------

$("quizBtn")
.addEventListener("click", () => {

    vocabularyView.classList.add("hidden");
    flashcardView.classList.add("hidden");

    quizView.classList.remove("hidden");
    quizView.classList.remove("view-enter"); void quizView.offsetWidth; quizView.classList.add("view-enter");

    setActiveNav("quizBtn");

    document
    .querySelectorAll(".quiz-option")
    .forEach(btn => {

        btn.style.display = "block";
    });

    if(questionNumber >= totalQuestions){

        questionNumber = 0;
    }

    startQuiz();
});

function startQuiz() {

    if(questionNumber === 0){

        score = 0;
        streak = 0;

        $(
            "scoreDisplay"
        ).textContent =
            "⭐ Score: 0";

        $(
            "streakDisplay"
        ).textContent =
            "🔥 Streak: 0";
    }

    if(vocabulary.length < 4) return;

    const result =
        $("quizResult");

    result.textContent = "";

    quizWord =
        vocabulary[
            Math.floor(
                Math.random() * vocabulary.length
            )
        ];

            $("quizSpeakBtn")
            .onclick = () => {

            speakJapanese(
                quizWord.hiragana
            );
        };



        
        const qEl = $("quizQuestion");
        qEl.classList.remove("q-in");
        qEl.classList.add("q-out");
        const newQ = quizMode === "kanjiToMeaning" ? quizWord.kanji : quizWord.meaning;
        qEl.addEventListener("animationend", () => {
            qEl.textContent = newQ;
            qEl.classList.remove("q-out");
            qEl.classList.add("q-in");
        }, { once: true });



    $(
        "quizCounter"
    ).textContent =
        `Question ${questionNumber + 1} / ${totalQuestions}`;

    $(
        "quizProgressFill"
    ).style.width =
        ((questionNumber / totalQuestions) * 100)
        + "%";

const isReverse = quizMode === "meaningToKanji";

    const options = [
        {
            display: isReverse ? quizWord.kanji : quizWord.meaning,
            correct: isReverse ? quizWord.kanji : quizWord.meaning
        }
    ];

    while(options.length < 4){

        const candidate =
            vocabulary[
                Math.floor(
                    Math.random() * vocabulary.length
                )
            ];

        const candidateDisplay =
            isReverse ? candidate.kanji : candidate.meaning;

        if(
            !options.some(
                item => item.display === candidateDisplay
            )
        ){
            options.push({
                display: candidateDisplay,
                correct: candidateDisplay
            });
        }
    }

    options.sort(() => Math.random() - 0.5);

    OPTION_IDS
    .forEach((id,index) => {
        const btn = $(id);
        btn.innerHTML = `
            <div class="quizMeaning">
                ${options[index].display}
            </div>
        `;
        btn.classList.remove("opt-enter");
        void btn.offsetWidth;
        btn.classList.add("opt-enter");
    });

    OPTION_IDS
    .forEach(id => {

        $(id).onclick =
        function(){

            const result =
            $(
                "quizResult"
            );

            const correctAnswer =
                quizMode === "meaningToKanji"
                    ? quizWord.kanji
                    : quizWord.meaning;

            const correct =
                this.textContent.includes(correctAnswer);

            document
            .querySelectorAll(".quiz-option")
            .forEach(btn => {

                btn.disabled = true;

                if(
                   btn.textContent.includes(correctAnswer)
                ){
                    btn.classList.add(
                        "correct"
                    );
                }
            });
            
            quizReport.push({

                question: quizWord.kanji,

                hiragana: quizWord.hiragana,

                correctAnswer: quizWord.meaning,

                selected: this.textContent,

                result: correct
            });

            if(correct){

            score++;
            streak++;

            bestStreak =
                Math.max(bestStreak, streak);

                this.classList.add(
                    "correct"
                );

                result.textContent =
                    "✅ Correct";

            }else{

                streak = 0;

                this.classList.add(
                    "wrong"
                );

                result.textContent =
                `❌ ${correctAnswer}`;
            }

            const scoreEl  = $("scoreDisplay");
            const streakEl = $("streakDisplay");

            scoreEl.textContent  = `⭐ Score: ${score}`;
            streakEl.textContent = `🔥 Streak: ${streak}`;
            $("bestStreakDisplay").textContent = `🏆 Best: ${bestStreak}`;

            // Score tick animation
            if (correct) {
                scoreEl.classList.remove("score-tick");
                void scoreEl.offsetWidth;
                scoreEl.classList.add("score-tick");
            }

            // Streak milestone flash (every 3)
            if (correct && streak > 0 && streak % 3 === 0) {
                streakEl.classList.remove("streak-milestone");
                void streakEl.offsetWidth;
                streakEl.classList.add("streak-milestone");
            }

            questionNumber++;

            setTimeout(() => {

                document
                .querySelectorAll(
                    ".quiz-option"
                )
                .forEach(btn => {

                    btn.disabled = false;

                    btn.classList.remove(
                        "correct",
                        "wrong"
                    );
                });

                if(
                    questionNumber >=
                    totalQuestions
                ){

                    showQuizSummary();

                }else{

                    startQuiz();
                }

            },1500);
        };
    });
}

function showQuizSummary(){

    const accuracy = Math.round((score / totalQuestions) * 100);

    let reportHTML = "";

    quizReport.forEach(item => {
        reportHTML += `
        <div class="quiz-report-item ${item.result ? 'r-correct' : 'r-wrong'}">
            <span class="r-icon">${item.result ? "✅" : "❌"}</span>
            <span class="r-kanji">${item.question}</span>
            <span class="r-kana">${item.hiragana}</span>
        </div>
        `;
    });

    $(
        "quizQuestion"
    ).textContent =
        "🎉 Quiz Complete";

    $(
        "quizResult"
    ).innerHTML =
    `<div class="quiz-summary">
        <div class="quiz-summary-score">
            <div class="score-big">${score}<span style="font-size:0.45em;color:var(--muted)">/${totalQuestions}</span></div>
            <div class="score-label">Final Score</div>
        </div>
        <div class="quiz-summary-stats">
            <div class="quiz-summary-stat">
                <div class="stat-val">${accuracy}%</div>
                <div class="stat-key">Accuracy</div>
            </div>
            <div class="quiz-summary-stat">
                <div class="stat-val">${bestStreak}</div>
                <div class="stat-key">Best Streak</div>
            </div>
            <div class="quiz-summary-stat">
                <div class="stat-val">${totalQuestions - score}</div>
                <div class="stat-key">Missed</div>
            </div>
        </div>
        <div class="quiz-report-list">${reportHTML}</div>
        <button class="quiz-summary-restart" id="restartQuizBtn">🔄 Start New Quiz</button>
    </div>`;

    document.getElementById("restartQuizBtn")
        .addEventListener("click", restartQuiz);

    document
    .querySelectorAll(".quiz-option")
    .forEach(btn => {

        btn.style.display = "none";
    });
}

// --------------------------------------------------
// VOCABULARY VIEW
// --------------------------------------------------

$("vocabBtn")
.addEventListener("click", () => {

    flashcardView.classList.add("hidden");
    quizView.classList.add("hidden");

    vocabularyView.classList.remove("hidden");
    vocabularyView.classList.remove("view-enter"); void vocabularyView.offsetWidth; vocabularyView.classList.add("view-enter");

    setActiveNav("vocabBtn");

    // Reset filteredVocabulary to full lesson, then re-render
    filteredVocabulary = [...vocabulary];
    searchBox.value = "";
    renderVocabulary();
});

// --------------------------------------------------
// PROGRESS
// --------------------------------------------------

function updateProgress() {

    if (vocabulary.length === 0) return;

    const learnedCount = vocabulary.filter(
        item => isLearned(item.kanji)
    ).length;

    const percent =
        Math.round((learnedCount / vocabulary.length) * 100);

    progressFill.style.width = percent + "%";
    lessonTitle.textContent =
        `Lesson ${lessonSelect.value}  ·  ${learnedCount}/${vocabulary.length} learned`;
}

function restartQuiz(){

    score = 0;

    streak = 0;

    bestStreak = 0;

    questionNumber = 0;

    quizReport = [];

    document
    .querySelectorAll(".quiz-option")
    .forEach(btn => {

        btn.style.display = "block";

        btn.disabled = false;

        btn.classList.remove(
            "correct",
            "wrong"
        );
    });

    startQuiz();
}

let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {

    if(window.scrollY > lastScrollY &&
       window.scrollY > 100){

        header.classList.add(
            "header-hidden"
        );

    }else{

        header.classList.remove(
            "header-hidden"
        );
    }

    lastScrollY =
        window.scrollY;
});

document.addEventListener(
    "mousemove",
    (e) => {

        if(e.clientY < 80){

            header.classList.remove(
                "header-hidden"
            );
        }
    }
);

// --------------------------------------------------
// LESSON DROPDOWN GENERATOR
// --------------------------------------------------

for (let i = 1; i <= 50; i++) {

    const option = document.createElement("option");

    option.value = i;

    option.textContent = `Lesson ${i}`;

    lessonSelect.appendChild(option);
}


// --------------------------------------------------
// QUIZ MODE TOGGLE
// --------------------------------------------------

$("modeKanjiBtn").addEventListener("click", () => {
    quizMode = "kanjiToMeaning";
    $("modeKanjiBtn").classList.add("active-mode");
    $("modeMeaningBtn").classList.remove("active-mode");
});

$("modeMeaningBtn").addEventListener("click", () => {
    quizMode = "meaningToKanji";
    $("modeMeaningBtn").classList.add("active-mode");
    $("modeKanjiBtn").classList.remove("active-mode");
});

// --------------------------------------------------
// FAVORITES VIEW
// --------------------------------------------------

$("favBtn").addEventListener("click", () => {
    flashcardView.classList.add("hidden");
    quizView.classList.add("hidden");
    vocabularyView.classList.remove("hidden");
    vocabularyView.classList.remove("view-enter"); void vocabularyView.offsetWidth; vocabularyView.classList.add("view-enter");

    setActiveNav("favBtn");

    const favs = getFavorites();
    filteredVocabulary = vocabulary.filter(
        item => favs.includes(item.kanji)
    );

    renderVocabulary();
});

// --------------------------------------------------
// THEME TOGGLE
// --------------------------------------------------

$("themeToggleBtn").addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    $("themeToggleBtn").textContent = isLight ? "🌙 Dark" : "☀️ Light";
    localStorage.setItem("jlpt_theme", isLight ? "light" : "dark");
});

// Restore saved theme
if (localStorage.getItem("jlpt_theme") === "light") {
    document.body.classList.add("light-theme");
    $("themeToggleBtn").textContent = "🌙 Dark";
}


// --------------------------------------------------
// INITIAL LOAD
// --------------------------------------------------

lessonSelect.value = 1;

setActiveNav("vocabBtn");

loadLesson(1);