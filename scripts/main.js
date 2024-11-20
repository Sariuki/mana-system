import { LitherniaManaSystem } from "./lithernia-mana.js";

Hooks.once('init', () => {
    console.log("Lithernia Mana System initialized");
});

Hooks.on("dnd5e.preCreateActor", (actorData, options, userId) => {
    // Initialize mana data
    actorData.flags["lithernia-mana-system"] = { 
        litherniaMana: new LitherniaManaSystem(actorData.data) 
    };

    // Remove spell slots (multiple locations, adjust paths as needed)
    delete actorData.data.spells;  
    // Pact magic slots
    delete actorData.data.resources.pact;
});

Hooks.on("dnd5e.preUpdateActor", (actor, updateData, options, userId) => {
    // Prevent spell slot updates (multiple locations)
    delete updateData.data?.spells;
    delete updateData.data?.resources?.pact; 
});

Hooks.on("dnd5e.restCompleted", async (actor, result) => {
    let manaSystem = duplicate(actor.getFlag("lithernia-mana-system", "litherniaMana"));

    if (result.longRest) {
        manaSystem.regenerateMana("longRest");
    } else {
        manaSystem.regenerateMana("shortRest");
    }
    actor.update({ [`flags.lithernia-mana-system.litherniaMana`]: manaSystem });
});

Hooks.on("dnd5e.preCastSpell", async (item, spellData) => {
    const actor = item.actor;
    const manaSystem = actor.getFlag("lithernia-mana-system", "litherniaMana");

    if (!manaSystem) {
        console.error("Lithernia Mana System not found for actor.");
        return false;
    }

    const manaCost = item.system.manaCost; // You need to add this to your spell items!

    if (manaSystem.currentMana < manaCost) {
        ui.notifications.warn(`${actor.name} does not have enough mana to cast ${item.name}!`);
        return false;
    }

    await actor.spendMana(manaCost); 
    // ... Implement your Lithernia-specific casting effects here (e.g., invocation circles, etc.)
});

// Add the spendMana function to the Actor5e prototype
Actor5e.prototype.spendMana = async function(cost) {
  let flag = duplicate(this.getFlag("lithernia-mana-system", "litherniaMana"));
  flag.spendMana(cost);
  await this.setFlag("lithernia-mana-system", "litherniaMana", flag); 
  return this.update({[`flags.lithernia-mana-system.litherniaMana`]: flag});
}