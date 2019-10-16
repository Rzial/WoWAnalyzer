import React from 'react';

import SPELLS from 'common/SPELLS';
import SpellIcon from 'common/SpellIcon';
import { formatNumber, formatPercentage } from 'common/format';

import Analyzer from 'parser/core/Analyzer';

import Abilities from 'parser/core/modules/Abilities';

import StatisticBox, { STATISTIC_ORDER } from 'interface/others/StatisticBox';

const AFFECTED_ABILITIES = [SPELLS.LIGHTNING_BOLT_OVERLOAD.id,
                           SPELLS.LIGHTNING_BOLT.id,
                           SPELLS.CHAIN_LIGHTNING_OVERLOAD.id,
                           SPELLS.CHAIN_LIGHTNING.id];

class Stormkeeper extends Analyzer {
  damageDoneByBuffedCasts = 0;
  stormkeeperCasts = 0;

  static dependencies = {
    abilities: Abilities,
  };

  constructor(...args) {
    super(...args);
    this.active = this.selectedCombatant.hasTalent(SPELLS.STORMKEEPER_TALENT.id);
  }

  on_byPlayer_damage(event) {
    if (!this.selectedCombatant.hasBuff(SPELLS.STORMKEEPER_TALENT.id)){
      return;
    }

    if (!AFFECTED_ABILITIES.includes(event.ability.guid)) {
      return;
    }
    this.damageDoneByBuffedCasts+=event.amount;
  }

  get damagePercent() {
    return this.owner.getPercentageOfTotalDamageDone(this.damageDoneByBuffedCasts);
  }

  get damagePerSecond() {
    return this.damageDoneByBuffedCasts / (this.owner.fightDuration / 1000);
  }

  on_byPlayer_applybuff(event){
    const spellId = event.ability.guid;
    if (spellId === SPELLS.STORMKEEPER_TALENT.id) {
      this.stormkeeperCasts += 1;
    }
  }

  on_fightend(event){
    this.abilities.abilities[9].castEfficiency.casts = (a, b) =>{
      return this.stormkeeperCasts;
    };
  }

  statistic() {
    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.STORMKEEPER_TALENT.id} />}
        value={`${formatNumber(this.damageDoneByBuffedCasts)} damage`}
        label="Damage Done by Buffed Casts"
        tooltip={`Buffed casts contributed ${formatNumber(this.damagePerSecond)} DPS (${formatPercentage(this.damagePercent)} of your damage)`}
      />
    );
  }
  statisticOrder = STATISTIC_ORDER.OPTIONAL();
}

export default Stormkeeper;
