import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntitySystem
} from "github.com/octarine-public/wrapper/index"

// --- ЗАГАЛЬНЕ МЕНЮ ---
const FeedEntry = Menu.AddEntry("Auto Feed Ultra");
const EnableFeed = FeedEntry.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedEntry.AddToggle("Я за ТЬМУ (Dire)", false); 

const ToxicEntry = Menu.AddEntry("Toxic King");
const EnabledToxic = ToxicEntry.AddToggle("Активувати тролінг", true);
const AutoLaugh = ToxicEntry.AddToggle("Авто-сміх при вбивстві", true);
const AutoChat = ToxicEntry.AddToggle("Писати '?' у чат", false);

// Координати та налаштування
const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);
const toxicPhrases = ["?", "ez", "nice try", "lmao", "why so serious?"];

let lastActionTime = 0;
const FEED_DELAY = 5000; // 5 секунд

// --- ЛОГІКА АВТО-ФІДУ ---
EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    if (currentTime - lastActionTime < FEED_DELAY) return;
    lastActionTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const TargetPosition = MySide.value ? RadiantFountain : DireFountain;

    // @ts-ignore
    MyHero.MoveTo(TargetPosition);
});

// --- ЛОГІКА TOXIC KING ---
// Використовуємо GameEvent для точного відстеження вбивств
EventsSDK.on("GameEvent", (event) => {
    if (!EnabledToxic.value) return;
    
    // Перевіряємо подію вбивства
    if (event.name === "entity_killed") {
        const MyHero = LocalPlayer?.Hero;
        if (!MyHero) return;

        // Отримуємо індекс вбивці з події
        const killerIndex = event.getInt("entindex_attacker");
        
        // Якщо вбивця — це ти
        if (killerIndex === MyHero.Index) {
            
            // 1. Авто-сміх
            if (AutoLaugh.value) {
                // @ts-ignore
                EventsSDK.ExecuteCommand("say /laugh");
            }

            // 2. Рандомна фраза
            if (AutoChat.value) {
                const phrase = toxicPhrases[Math.floor(Math.random() * toxicPhrases.length)];
                // @ts-ignore
                EventsSDK.ExecuteCommand(`say ${phrase}`);
            }
        }
    }
});

console.log("Скрипти Дениса об'єднано та активовано!");
