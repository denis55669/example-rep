import { GameSDK, ItemSDK, Menu, ImageData, EventsSDK } from "github.com/octarine-public/wrapper/index";

// --- СОЗДАНИЕ МЕНЮ (Как в примере abuse-midas) ---
const Root = Menu.AddEntryDeep(["Custom Scripts", "Denis Abuse"])
const ArmletNode = Root.AddNode("Armlet Abuse", ImageData.Icons.item_armlet)

const Enabled = ArmletNode.AddToggle("Enabled", true)
const Threshold = ArmletNode.AddSlider("HP Threshold", 300, 50, 600, 10)
const StopAttack = ArmletNode.AddToggle("Stop Attack on Abuse", true)

// --- ЛОГИКА АБУЗА ---
EventsSDK.on("GameTick", () => {
    if (!Enabled.Value) return;

    const me = GameSDK.GetLocalPlayer();
    if (!me || !me.IsAlive()) return;

    const armlet = ItemSDK.GetItemByName(me, "item_armlet");
    if (!armlet) return;

    const health = me.GetHealth();
    const isToggled = ItemSDK.IsToggled(armlet);

    // Если здоровья мало — запускаем абуз
    if (health <= Threshold.Value && isToggled) {
        
        // Останавливаем атаку, чтобы не сбили абуз (mc_stop)
        if (StopAttack.Value) {
            GameSDK.ExecuteCommand("mc_stop");
        }

        // Мгновенное выключение и включение
        ItemSDK.UseItem(armlet); // Off
        ItemSDK.UseItem(armlet); // On
    }
});
