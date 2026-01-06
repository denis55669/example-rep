import { EventsSDK, GameSDK, ItemSDK, Menu, ImageData } from "github.com/octarine-public/wrapper/index"

const MyScripts = Menu.AddEntryDeep(["Custom Scripts", "Денис"])
const ArmletNode = MyScripts.AddNode("Абуз Армлета", ImageData.Icons.item_armlet)

const IsEnabled = ArmletNode.AddToggle("Увімкнути", true)
const HpThreshold = ArmletNode.AddSlider("Поріг Здоров'я", 300, 50, 600, 10)

EventsSDK.on("GameTick", () => {
    if (!IsEnabled.Value) return;

    const me = GameSDK.GetLocalPlayer(); // Виправив EntitySDK на GameSDK
    if (!me || !me.IsAlive()) return; // Виправив isAlive на IsAlive

    const armlet = ItemSDK.GetItemByName(me, "item_armlet"); // Виправив getItemByName на GetItemByName
    if (!armlet) return;

    const health = me.GetHealth(); // Виправив getHealth на GetHealth
    const isToggled = ItemSDK.IsToggled(armlet); // Виправив isToggled на IsToggled

    if (health <= HpThreshold.Value && isToggled) {
        ItemSDK.UseItem(armlet); // Вимкнути
        ItemSDK.UseItem(armlet); // Увімкнути
    }
});
