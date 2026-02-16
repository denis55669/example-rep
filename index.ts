import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Grief Lord V27", "panorama/images/items/divine_rapier_png.vtex_c");

// Вибір сторони
const RunRadiant = Main.AddToggle("1. БІГТИ ВНИЗ (Radiant)", false);
const RunDire = Main.AddToggle("2. БІГТИ ВГОРУ (Dire)", false);

// Кого відправляти
const FeedHero = Main.AddToggle("3. Герой", false);
const FeedCour = Main.AddToggle("4. Кур'єри", false);
const FeedAllies = Main.AddToggle("5. Союзники (Shared)", false);

let lastOrder = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    // Спамимо частіше, як у скрипті Block.ts (раз на 0.2 сек)
    if (now - lastOrder < 200) return;
    lastOrder = now;

    // 1. ЦІЛЬ
    let target: Vector3 | null = null;
    if (RunRadiant.value) target = new Vector3(-7200, -6600, 384);
    else if (RunDire.value) target = new Vector3(7200, 6500, 384);

    if (!target) return;

    // Рандом, щоб сервер не ігнорував команди
    target.x += (Math.random() * 100 - 50);
    target.y += (Math.random() * 100 - 50);

    // 2. ЗБИРАЄМО АРМІЮ (Логіка з Controllables.ts)
    const army: any[] = [];

    // ГЕРОЙ
    if (FeedHero.value) army.push(Me);

    // КУР'ЄРИ
    if (FeedCour.value) {
        const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
        for (const cour of couriers) {
            // @ts-ignore
            // Перевіряємо IsControllable, як у файлі Controllables.ts
            if (cour.IsAlive && cour.IsMyTeam && cour.IsControllable) {
                army.push(cour);
            }
        }
    }

    // СОЮЗНИКИ
    if (FeedAllies.value) {
        const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
        for (const hero of heroes) {
            // @ts-ignore
            if (hero.IsAlive && hero.IsMyTeam && !hero.IsMe && hero.IsControllable) {
                army.push(hero);
            }
        }
    }

    // 3. ВИКОНАННЯ НАКАЗУ (СЕКРЕТНИЙ МЕТОД)
    for (const unit of army) {
        // Використовуємо аргументи: (position, queue=false, bypass=true)
        // Це взято з файлу Controllables.ts -> function MoveUnit
        try {
            // @ts-ignore
            unit.MoveTo(target, false, true);
        } catch (e) {
            // Якщо не спрацювало, пробуємо звичайний метод
            // @ts-ignore
            unit.MoveTo(target);
        }
    }
});

console.log("Grief Lord V27 (Pro Logic) Loaded!");
