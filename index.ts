import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const FeedEntry = Menu.AddEntry("Auto Feed Ultra");
const EnableFeed = FeedEntry.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedEntry.AddToggle("Я за ТЬМУ (Dire)", false); 

const ToxicEntry = Menu.AddEntry("Toxic King");
const EnabledToxic = ToxicEntry.AddToggle("Активувати тролінг", true);
const AutoLaugh = ToxicEntry.AddToggle("Авто-сміх", true);
const AutoChat = ToxicEntry.AddToggle("Писати в чат", false);

// Координати та змінні
const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);
const toxicPhrases = ["?", "ez", "nice try", "lmao", "why so serious?"];

let lastActionTime = 0;
let lastKills = 0; // Слідкуємо за кількістю вбивств
let isFirstRun = true;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    // --- ЛОГІКА TOXIC KING (Через лічильник вбивств) ---
    if (EnabledToxic.value) {
        // Отримуємо поточну кількість вбивств
        // @ts-ignore
        const currentKills = MyHero.Kills; 

        // Якщо це перший запуск - просто запам'ятовуємо вбивства
        if (isFirstRun) {
            lastKills = currentKills;
            isFirstRun = false;
        }

        // Якщо кількість вбивств збільшилась!
        if (currentKills > lastKills) {
            lastKills = currentKills;

            // 1. Сміємось
            if (AutoLaugh.value) {
                // @ts-ignore
                EventsSDK.ExecuteCommand("say /laugh");
            }

            // 2. Пишемо в чат
            if (AutoChat.value) {
                const phrase = toxicPhrases[Math.floor(Math.random() * toxicPhrases.length)];
                // @ts-ignore
                EventsSDK.ExecuteCommand(`say ${phrase}`);
            }
        }
        
        // Якщо тебе вбили або заденаїли (скидаємо лічильник, якщо вбивств стало менше)
