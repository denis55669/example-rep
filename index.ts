import { EventsSDK, GameSDK, ItemSDK, Menu, ImageData, EntitySDK } from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (как на скриншоте) ---
const MyScripts = Menu.AddEntryDeep(["Custom Scripts", "Денис"])
const ArmletNode = MyScripts.AddNode("Абуз Армлета", ImageData.Icons.item_armlet)

const IsEnabled = ArmletNode.AddToggle("Включить", true)
const HpThreshold = ArmletNode.AddSlider("Порог Здоровья", 300, 50, 600, 10)
const CancelAttack = ArmletNode.AddToggle("Отмена атаки для абуза", true)
const EnemyCheck = ArmletNode.AddToggle("Проверять врагов в радиусе", true)

// --- ЛОГИКА ---
EventsSDK.on("GameTick", () => {
    if (!IsEnabled.Value) return;

    const me = GameSDK.GetLocalPlayer();
    if (!me || !me.IsAlive()) return;

    const armlet = ItemSDK.GetItemByName(me, "item_armlet");
    if (!armlet) return;

    const health = me.GetHealth();
    const isToggled = ItemSDK.IsToggled(armlet);

    // Умная проверка врагов (из твоего Lua файла)
    let shouldAbuse = health <= HpThreshold.Value;
    
    if (EnemyCheck.Value) {
        const enemies = EntitySDK.getHeroes(true, true).filter(h => 
            !h.isSameTeam(me) && h.isAlive() && h.getDistance(me) <= 1200
        );
        // Если врагов нет и ХП выше 15%, абуз не обязателен (пример логики)
        if (enemies.length === 0 && health > 150) shouldAbuse = false;
    }

    if (shouldAbuse && isToggled) {
        // Если нужно отменить атаку (как на скриншоте)
        if (CancelAttack.Value) {
            // Команда 'Stop' для героя
            GameSDK.ExecuteCommand("mc_stop");
        }

        // Сам абуз
        ItemSDK.UseItem(armlet); // Выключить
        ItemSDK.UseItem(armlet); // Включить
    }
});
