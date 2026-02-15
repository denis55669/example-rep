import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (только самое нужное) ---
const FeedMenu = Menu.AddEntry("Auto Feed");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 

const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

let lastActionTime = 0;
const DELAY = 5000; // Клик раз в 5 секунд для безопасности

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    if (currentTime - lastActionTime < DELAY) return;
    lastActionTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const TargetPosition = MySide.value ? RadiantFountain : DireFountain;

    // ФИД ТОЛЬКО МОИМ ГЕРОЕМ
    // @ts-ignore
    MyHero.MoveTo(TargetPosition);
});

console.log("Auto Feed: Только мой герой, клики раз в 5 секунд.");
import {
    EventsSDK,
    LocalPlayer,
    Menu,
    EntitySystem
} from "github.com/octarine-public/wrapper/index"

const Entry = Menu.AddEntry("Toxic King");
const Enabled = Entry.AddToggle("Активувати тролінг", true);
const AutoLaugh = Entry.AddToggle("Авто-сміх при вбивстві", true);
const AutoChat = Entry.AddToggle("Писати '?' у чат", false);

const toxicPhrases = ["?", "ez", "nice try", "lmao", "why so serious?"];

EventsSDK.on("EntityKilled", (victim, killer) => {
    if (!Enabled.value || !killer || !victim) return;

    const MyHero = LocalPlayer?.Hero;
    
    // Перевіряємо, чи вбивство зробив ти
    if (killer === MyHero) {
        
        // 1. Авто-сміх
        if (AutoLaugh.value) {
            // @ts-ignore
            EventsSDK.ExecuteCommand("say /laugh");
        }

        // 2. Рандомна фраза в чат
        if (AutoChat.value) {
            const phrase = toxicPhrases[Math.floor(Math.random() * toxicPhrases.length)];
            // @ts-ignore
            EventsSDK.ExecuteCommand(`say ${phrase}`);
        }
    }
});

console.log("Toxic King завантажено! Покажи їм, хто тут батя.");
