import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- ГЛАВНАЯ ВКЛАДКА "УТИЛИТЫ" ---
// (Без иконки на папке, чтобы точно создалась)
const Utils = Menu.AddEntry("Denis Utilities");

// --- ПОД-ВКЛАДКА "GRIEF LORD" ---
// С иконкой Рапиры, как ты просил
const Feeder = Utils.AddEntry("Grief Lord", "panorama/images/items/divine_rapier_png.vtex_c");

const FeedHero = Feeder.AddToggle("1. Фід Героєм", false);
const FeedCour = Feeder.AddToggle("2. Фід Курами", false);
const FeedAllies = Feeder.AddToggle("3. Фід Тіммейтами (Shared)", false);
const Side = Feeder.AddList("Сторона фіду", ["Dire -> Run Radiant", "Radiant -> Run Dire"], 1);

let lastOrder = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // Раз на 3 секунды раздаем приказы
    if (now - lastOrder > 3000) {
        lastOrder = now;

        // 1. Выбираем цель (Фонтан врага)
        let target = new Vector3(0, 0, 0);
        if (Side.value === 0) { 
            // Мы Dire, бежим к Radiant (Вниз-Влево)
            target = new Vector3(-7200, -6600, 384);
        } else {
            // Мы Radiant, бежим к Dire (Вверх-Вправо)
            target = new Vector3(7200, 6500, 384);
        }

        // Рандом, чтобы не бежали в одну точку
        target.x += (Math.random() * 500 - 250);
        target.y += (Math.random() * 500 - 250);

        // 2. ФИД ГЕРОЕМ
        if (FeedHero.value) {
            // @ts-ignore
            Me.MoveTo(target);
        }

        // 3. ФИД КУРЬЕРАМИ
        if (FeedCour.value) {
            try {
                const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
                for (const cour of couriers) {
                    // @ts-ignore
                    if (cour.IsAlive && cour.IsMyTeam) {
                        // @ts-ignore
                        cour.MoveTo(target);
                    }
                }
            } catch (e) {
                // Если ошибка с курами - игнорируем, чтобы скрипт не упал
            }
        }

        // 4. ФИД СОЮЗНИКАМИ (Ливеры / Расшаренные)
        if (FeedAllies.value) {
            try {
                const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
                for (const hero of heroes) {
                    // @ts-ignore
                    // Проверяем: живой, союзник, не я, и МОЖНО КОНТРОЛИРОВАТЬ
                    if (hero.IsAlive && hero.IsMyTeam && !hero.IsMe && hero.IsControllable) {
                        // @ts-ignore
                        hero.MoveTo(target);
                    }
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }
    }
});

console.log("Denis Utilities V22 Loaded!");
