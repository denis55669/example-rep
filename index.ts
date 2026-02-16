import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Sonic Feeder V34", "panorama/images/items/travel_boots_png.vtex_c");

const RunDire = Main.AddToggle("1. Бежать в DIRE (Вверх)", false);
const RunRadiant = Main.AddToggle("2. Бежать в RADIANT (Вниз)", false);
const AutoBuy = Main.AddToggle("3. Авто-закуп (Тапок/Смоки/Травела)", true);

let lastMove = 0;
let lastBuy = 0;

// Координаты фонтанов (Точные центры)
const POS_DIRE = new Vector3(7200, 6500, 384);
const POS_RADIANT = new Vector3(-7200, -6600, 384);

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();

    // --- 1. АВТО-ЗАКУП И ИСПОЛЬЗОВАНИЕ ПРЕДМЕТОВ (Раз в 1 сек) ---
    if (AutoBuy.value && now - lastBuy > 1000) {
        lastBuy = now;

        // Покупаем предметы, если мы в магазине (обычно на респауне)
        if (Me.IsShopOpen) {
            // 1. Покупаем Тапок (если нет ни тапка, ни травелов)
            if (!HasItem(Me, "item_boots") && !HasItem(Me, "item_travel_boots") && !HasItem(Me, "item_travel_boots_2")) {
                EventsSDK.ExecuteCommand("dota_purchase_item item_boots");
            }

            // 2. Покупаем Смоки (Всегда, если есть деньги)
            // Смоки дают скорость и инвиз от крипов
            EventsSDK.ExecuteCommand("dota_purchase_item item_smoke_of_deceit");

            // 3. Апгрейд в Травела (Если накопили)
            if (Me.Gold > 2000) {
                 EventsSDK.ExecuteCommand("dota_purchase_item item_travel_boots");
            }
        }

        // --- АВТО-ИСПОЛЬЗОВАНИЕ СМОКОВ ---
        const smoke = GetItem(Me, "item_smoke_of_deceit");
        if (smoke && smoke.CanCast) {
            // Юзаем смок, чтобы быстрее бежать
            smoke.CastNoTarget();
        }
    }

    // --- 2. ДВИЖЕНИЕ (Постоянный спам) ---
    // Спамим часто (раз в 100 мс), чтобы перебивать любые попытки остановки
    if (now - lastMove < 100) return;
    lastMove = now;

    let target: Vector3 | null = null;
    
    // Выбираем базу
    if (RunDire.value) target = new Vector3(POS_DIRE.x, POS_DIRE.y, POS_DIRE.z);
    else if (RunRadiant.value) target = new Vector3(POS_RADIANT.x, POS_RADIANT.y, POS_RADIANT.z);

    if (target) {
        // --- ГЛАВНАЯ ФИШКА: РАНДОМНЫЕ ТОЧКИ ВНУТРИ ФОНТАНА ---
        // Добавляем случайный разброс +/- 800 единиц.
        // Это заставляет героя забегать в фонтан с разных сторон.
        target.x += (Math.random() * 1600 - 800);
        target.y += (Math.random() * 1600 - 800);

        // @ts-ignore
        Me.MoveTo(target);
    }
});

// Вспомогательная функция: Проверка наличия предмета
function HasItem(unit: Unit, itemName: string): boolean {
    // Проверяем инвентарь (0-5) и рюкзак (6-8)
    for (let i = 0; i <= 8; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === itemName) return true;
    }
    return false;
}

// Вспомогательная функция: Получить предмет (чтобы юзнуть)
function GetItem(unit: Unit, itemName: string): any {
    for (let i = 0; i <= 5; i++) { // Только активные слоты
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === itemName) return item;
    }
    return null;
}

console.log("Sonic Feeder V34 Loaded!");
