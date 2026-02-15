import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager,
    Player,
    Input
} from "github.com/octarine-public/wrapper/index"

// --- НАЛАШТУВАННЯ МЕНЮ ---
const Utils = Menu.AddEntry("Denis Utilities", "panorama/images/hud/reborn/settings_icon_psd.vtex_c");
const Feeder = Utils.AddEntry("Grief Lord", "panorama/images/items/divine_rapier_png.vtex_c");

const FeedHero = Feeder.AddToggle("1. Фід ГЕРОЄМ", false);
const FeedCour = Feeder.AddToggle("2. Фід КУР'ЄРАМИ", false);
const FeedAllies = Feeder.AddToggle("3. Фід СОЮЗНИКАМИ (Shared/Leavers)", false);
const Side = Feeder.AddList("Куди бігти?", ["DIRE (Вниз-Вліво -> Radiant)", "RADIANT (Вгору-Вправо -> Dire)"], 0);

// --- СИСТЕМНІ КОНСТАНТИ (Щоб скрипт не ламався без Enum) ---
const DOTA_UNIT_ORDER_MOVE_TO_POSITION = 5;
const DOTA_UNIT_ORDER_ATTACK_MOVE = 8;

let lastTick = 0;

// --- ГОЛОВНИЙ ЦИКЛ ---
EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    // Частота оновлення наказів (2.5 сек - ідеально для сервера)
    if (now - lastTick < 2500) return;
    lastTick = now;

    // 1. Визначаємо ціль
    let targetPos: Vector3;
    if (Side.value === 0) {
        // Ми граємо за DIRE, біжимо на базу Radiant
        targetPos = new Vector3(-7149, -6696, 384); 
    } else {
        // Ми граємо за RADIANT, біжимо на базу Dire
        targetPos = new Vector3(7149, 6696, 384);
    }

    // Додаємо мікро-рандом, щоб сервер не ігнорував однакові команди
    targetPos.x += (Math.random() * 300 - 150);
    targetPos.y += (Math.random() * 300 - 150);

    // --- БЛОК ВИКОНАННЯ ---

    // 1. ГЕРОЙ
    if (FeedHero.value) {
        ForceMove(Me, targetPos);
    }

    // 2. КУР'ЄРИ
    if (FeedCour.value) {
        try {
            const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
            for (const cour of couriers) {
                // @ts-ignore
                if (cour && cour.IsAlive && cour.IsMyTeam) {
                    ForceMove(cour, targetPos);
                }
            }
        } catch (e) {}
    }

    // 3. СОЮЗНИКИ (Ті, кого можна контролювати)
    if (FeedAllies.value) {
        try {
            const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
            for (const hero of heroes) {
                // @ts-ignore
                // Перевірка: Живий + Свій + Не я + Є контроль
                if (hero && hero.IsAlive && hero.IsMyTeam && !hero.IsMe && hero.IsControllable) {
                    ForceMove(hero, targetPos);
                }
            }
        } catch (e) {}
    }
});

// --- ФУНКЦІЯ "СИЛОВОГО" РУХУ (THE BIG CODE) ---
function ForceMove(unit: any, pos: Vector3) {
    if (!unit || !pos) return;

    // СПОСІБ 1: Player.PrepareOrder (Найпотужніший - прямий пакет на сервер)
    // Це емулює натискання правої кнопки миші на рівні движка
    try {
        if (Player && Player.PrepareOrder) {
            Player.PrepareOrder(
                LocalPlayer.RawPlayer,        // Від кого наказ (від нас)
                DOTA_UNIT_ORDER_MOVE_TO_POSITION, // Тип наказу (Рух)
                0,                            // targetIndex (не треба для руху в точку)
                pos,                          // Куди йти
                0,                            // abilityIndex (не треба)
                unit,                         // Яким юнітом керуємо
                false,                        // queue (черга? ні, зразу!)
                true                          // showEffects (показувати клік? так!)
            );
            return; // Якщо спрацювало - виходимо
        }
    } catch (error) {
        // Якщо Player не знайдено, йдемо до Способу 2
    }

    // СПОСІБ 2: Unit.MoveTo (Стандартний API)
    // Запасний варіант, якщо перший не спрацював
    try {
        if (unit.MoveTo) {
            unit.MoveTo(pos);
        }
    } catch (error) {
        console.log("Move Failed for unit: " + unit.Name);
    }
}

console.log("Denis Grief Lord: HARDCORE MODE Loaded!");
