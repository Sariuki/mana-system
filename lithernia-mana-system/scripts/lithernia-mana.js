export class LitherniaManaSystem {
    constructor(actorData) {
        this.actorData = actorData;
        this.maxMana = this.calculateMaxMana();
        this.currentMana = this.maxMana;
        this.manaDebt = 0;
        this.manaDice = this.getManaDice();
        this.invocationCircleLevel = 0;
        this.feats = actorData.feats || []; // Get feats from actor data (if available)
    }

    calculateMaxMana() {
        const classTable = {
            "wizard": level => 8,
            "sorcerer": level => 10,
            "warlock": level => 6,
            "cleric": level => 8,
            "druid": level => 10,
            "bard": level => 6
            // ... other classes
        };
        const level = this.actorData.level;
        const className = this.actorData.class;
        const baseMana = classTable[className]?.(level) ?? 0;  // Handle undefined classes safely
        const abilityModifier = this.getAbilityModifier();
        const maxMana = baseMana - 1 + level + abilityModifier * level;

        return maxMana < 0 ? 0 : maxMana; // Prevent mana from being negative
    }

    getManaDice() {
        const classDice = {
            "wizard": "1d6",
            "sorcerer": "1d8",
            "warlock": "1d10",
            "cleric": "1d8",
            "druid": "1d8",
            "bard": "1d6"
            // ... other classes
        };
  
          const className = this.actorData.class;
          return classDice[className] || "1d6"; // Default to 1d6
      }
    spendMana(amount) {
        if (this.currentMana >= amount) {
            this.currentMana -= amount;
        } else {
            const overexpenditure = amount - this.currentMana;
            this.currentMana = 0;
            this.manaDebt += overexpenditure;
        }

        // Calculate and apply mana fatigue (if applicable)
        this.calculateManaFatigue(amount);
    }


    calculateManaFatigue(manaSpent) {
        if (!this.manaDice) {
            console.error("Mana dice not defined for this actor.");
            return;
        }

        const fatiguePerPoint = {
            1: 0.25,
            2: 0.5,
            3: 0.75,
            4: 1
        };

        let fatigueMultiplier = 0;
        for (let key in fatiguePerPoint) {
            if (manaSpent <= this.maxMana * fatiguePerPoint[key]) {
                fatigueMultiplier = parseInt(key);
                break;
            }
        }
        if (fatigueMultiplier === 0 && manaSpent > this.maxMana) {
            fatigueMultiplier = manaSpent / this.maxMana;
        }


        const fatigueRoll = new Roll(this.manaDice).roll({async: false});
        this.manaFatigue += fatigueRoll.total * fatigueMultiplier;

        this.checkFatigueConsequences();


    }

    checkFatigueConsequences() {

      const maxManaHalf = this.maxMana / 2;


      //Exhaustion
      if (this.manaFatigue >= maxManaHalf) {
        this.exhaustionLevel = Math.floor(this.manaFatigue / maxManaHalf);


        // Example Exhaustion Effects. Replace these with the effects relevant to your system.
        switch (this.exhaustionLevel) {
            case 1:
                // Level 1 exhaustion effects
                console.log("Level 1 Exhaustion - Disadvantage on Ability Checks"); // Example effect
                break;
            case 2:
                console.log("Level 2 Exhaustion - Disadvantage on Saving Throws");
                break;
            case 3:
              console.log("Level 3 Exhaustion - Speed halved");
                break;
            case 4:
                console.log("Level 4 Exhaustion - Disadvantage on Attack Rolls");
                break;
            case 5:
                console.log("Level 5 Exhaustion - Speed reduced to 0");
                break;
            case 6:
              console.log("Level 6 Exhaustion - Death");
              // Implement death (e.g., set actor's HP to 0, change status)
              break;
            default:
                break;
        }
      }


        if (this.manaFatigue >= this.maxMana * 2) {
            // Handle death. You'll probably want to separate this from exhaustion level 6 above
            console.log("Death from Mana Fatigue!");
            // Implement death in your system (e.g. set actor hp to 0)

        }


    }

    regenerateMana(method) {
        switch (method) {
            case "longRest":
                this.currentMana = this.maxMana;
                this.manaDebt = 0; // Reset mana debt on long rest
                break;
            case "shortRest":
              // Implement short rest mana regeneration (mana dice)
              const roll = new Roll(this.manaDice).roll(); //Assumes you have imported Roll from Foundry
              this.currentMana += roll.total;
                break;
            // Add other regeneration methods as needed.
            default:
                break;

        }

        this.currentMana = Math.min(this.currentMana, this.maxMana); // Ensure currentMana doesn't exceed maxMana
        //Consider adding logic for handling mana debt with short rests and other regeneration methods.
    }
    getAbilityModifier(){
        const className = this.actorData.class;
        const castingAbiliy = this.getCastingAbility(className);
        return this.actorData.abilities[castingAbiliy]?.mod ?? 0;
      }
      getCastingAbility(className) {
          switch (className) {
              case "wizard":
                    return "int";
              case "sorcerer":
              case "warlock":
              case "bard":
                  return "cha";
              case "cleric":
              case "druid":
                  return "wis";
              default:
                  return "int"; // Default to Intelligence if class not found
          }
      }


}
