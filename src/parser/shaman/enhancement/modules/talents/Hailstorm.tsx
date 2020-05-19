import React from 'react';
import SPELLS from 'common/SPELLS/index';
import { formatPercentage } from 'common/format';

import Analyzer from 'parser/core/Analyzer';

import Statistic from 'interface/statistics/Statistic';
import { Trans } from '@lingui/macro';
import BoringSpellValue from 'interface/statistics/components/BoringSpellValue';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';

class Hailstorm extends Analyzer {

  /**
   * Frostbrand now also enhances your weapon's damage,
   * causing each of your weapon attacks to also deal
   * (3.159% of Attack power)% Frost damage.
   *
   * Example Log:
   */

  constructor(options: any) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(SPELLS.HAILSTORM_TALENT.id);
  }

  get frostBrandUptime() {
    return this.selectedCombatant.getBuffUptime(SPELLS.FROSTBRAND.id) / this.owner.fightDuration;
  }

  get frostBrandSuggestionTresholds() {
    return {
      actual: this.frostBrandUptime,
      isLessThan: {
        minor: 0.95,
        average: 0.95,
        major: 0.85,
      },
      style: 'percentage',
    };
  }

  suggestions(when: any) {
    when(this.frostBrandSuggestionTresholds).addSuggestion(
      (suggest: any, actual: any, recommended: any) => {
        return suggest(
          <Trans>
            Try to make sure the Frostbrand is always up, when it drops you should refresh it as soon as possible
          </Trans>,
        )
          .icon(SPELLS.FROSTBRAND.icon)
          .actual(
            <Trans>
              {formatPercentage(actual)}% uptime
            </Trans>,
          )
          .recommended(
            <Trans>
              {formatPercentage(recommended, 0)}% is recommended
            </Trans>,
          );
      },
    );
  }

  statistic() {
    return (
      <Statistic
        category="TALENTS"
        position={STATISTIC_ORDER.CORE(1)}
        size="small"
      >
        <BoringSpellValue
          spell={SPELLS.FROSTBRAND}
          value={`${formatPercentage(this.frostBrandUptime)} %`}
          label="Frostband Uptime"
        />
      </Statistic>
    );
  }
}

export default Hailstorm;
