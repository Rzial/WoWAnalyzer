import SPELLS from 'common/SPELLS';
import COVENANTS from 'game/shadowlands/COVENANTS';
import Analyzer, { Options } from 'parser/core/Analyzer';
import Abilities from 'parser/core/modules/Abilities';
import SPELL_CATEGORY from 'parser/core/SPELL_CATEGORY';

class VanquishersHammer extends Analyzer {
  static dependencies = {
    abilities: Abilities,
  };
  protected abilities!: Abilities;

  constructor(options: Options) {
    super(options);

    this.active = this.selectedCombatant.hasCovenant(COVENANTS.NECROLORD.id);

    if (!this.active) {
      return;
    }

    (options.abilities as Abilities).add({
      spell: SPELLS.VANQUISHERS_HAMMER.id,
      category: SPELL_CATEGORY.COOLDOWNS,
      cooldown: 30,
      charges: this.selectedCombatant.hasLegendary(SPELLS.DUTY_BOUND_GAVEL) ? 2 : 1,
      gcd: {
        base: 1500,
      },
      castEfficiency: {
        suggestion: true,
        recommendedEfficiency: 0.8,
      },
    });
  }
}

export default VanquishersHammer;