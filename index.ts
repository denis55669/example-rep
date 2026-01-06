import { EventsSDK, EntitySDK, ItemSDK, Menu, ImageData } from "github.com/octarine-public/wrapper/index"

const MyScripts = Menu.AddEntryDeep(["Custom Scripts", "Денис"])
const ArmletNode = MyScripts.AddNode("Абуз Армлета", ImageData.Icons.item_armlet)

const IsEnabled = ArmletNode.AddToggle("Увімкнути", true)
const HpThreshold = ArmletNode.AddSlider("Поріг Здоров'я", 300, 50, 600, 10)
const CancelAttack = ArmletNode.AddToggle("Відміна атаки", true)

EventsSDK.on("GameTick", () => {
    if (!IsEnabled.Value) return;

    const me = EntitySDK.getLocalPlayer();
    if (!me || !me.isAlive()) return;

    const armlet = ItemSDK.getItemByName(me, "item_armlet");
    if (!armlet) return;

    const health = me.getHealth();
    const isToggled = ItemSDK.isToggled(armlet);

    if (health <= HpThreshold.Value && isToggled) {
        ItemSDK.useItem(armlet);
        ItemSDK.useItem(armlet);
    }
});
