import { GameSDK, ItemSDK, Menu, ImageData, EventsSDK } from "github.com/octarine-public/wrapper/index";

// --- MENU ---
const MyScripts = Menu.AddEntryDeep(["Custom Scripts", "Denis"])
const ArmletNode = MyScripts.AddNode("Armlet Abuse", ImageData.Icons.item_armlet)

const IsEnabled = ArmletNode.AddToggle("Enabled", true)
const HpThreshold = ArmletNode.AddSlider("HP Threshold", 300, 50, 600, 10)
const CancelAttack = ArmletNode.AddToggle("Cancel Attack", true)
const EnemyCheck = ArmletNode.AddToggle("Enemy Check", true)

// --- LOGIC ---
EventsSDK.on("GameTick", () => {
    if (!IsEnabled.Value) return;

    const me = GameSDK.GetLocalPlayer();
    if (!me || !me.IsAlive()) return;

    const armlet = ItemSDK.GetItemByName(me, "item_armlet");
    if (!armlet) return;

    const health = me.GetHealth();
    const isToggled = ItemSDK.IsToggled(armlet);

    let shouldAbuse = health <= HpThreshold.Value;
    
    if (EnemyCheck.Value) {
        const enemies = GameSDK.getHeroes(true, true).filter(h => 
            !h.isSameTeam(me) && h.isAlive() && h.getDistance(me) <= 1200
        );
        if (enemies.length === 0 && health > 150) shouldAbuse = false;
    }

    if (shouldAbuse && isToggled) {
        if (CancelAttack.Value) {
            GameSDK.ExecuteCommand("mc_stop");
        }
        ItemSDK.UseItem(armlet);
        ItemSDK.UseItem(armlet);
    }
});
