import { formatNumber, formatPercentage, formatMilliseconds } from 'common/format';
import SPELLS from 'common/SPELLS';
import Spell from 'common/SPELLS/Spell';
import UptimeIcon from 'interface/icons/Uptime';
import Analyzer, { Options, SELECTED_PLAYER, SELECTED_PLAYER_PET } from 'parser/core/Analyzer';
import calculateEffectiveDamage from 'parser/core/calculateEffectiveDamage';
import conduitScaling from 'parser/core/conduitScaling';
import Events, { CastEvent, DamageEvent, SummonEvent } from 'parser/core/Events';
import SpellUsable from 'parser/shared/modules/SpellUsable';
import ConduitSpellText from 'parser/ui/ConduitSpellText';
import ItemDamageDone from 'parser/ui/ItemDamageDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';

import { ABILITIES_AFFECTED_BY_MASTERY } from '../../constants';

const XUENS_BOND_REDUCTION = 100;

class XuensBond extends Analyzer {
  static dependencies = {
    spellUsable: SpellUsable,
  };
  XB_MOD = 0;
  totalDamage = 0;
  XB_CDR_Used = 0;
  XB_CDR_Wasted = 0;
  spellToReduce: Spell = SPELLS.INVOKE_XUEN_THE_WHITE_TIGER;
  cloneIDs = new Set();
  cloneMap: Map<number, number> = new Map<number, number>();
  protected spellUsable!: SpellUsable;
  /**
   * Increase damage from Xuen by x%
   */
  constructor(options: Options) {
    super(options);
    const conduitRank = this.selectedCombatant.conduitRankBySpellID(SPELLS.XUENS_BOND.id);
    if (!conduitRank) {
      this.active = false;
      return;
    }

    this.XB_MOD = conduitScaling(0.1, conduitRank);
    //summon events (need to track this to get melees)
    this.addEventListener(
      Events.summon.by(SELECTED_PLAYER).spell(SPELLS.INVOKE_XUEN_THE_WHITE_TIGER),
      this.trackSummons,
    );
    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER_PET).spell(SPELLS.MELEE),
      this.handleMelee,
    );
    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER_PET).spell(SPELLS.XUEN_CRACKLING_TIGER_LIGHTNING),
      this.onXCTLDamage,
    );
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(ABILITIES_AFFECTED_BY_MASTERY),
      this.XBCDRSpell,
    );
  }
  XBCDRSpell(event: CastEvent) {
    if (this.spellUsable.isOnCooldown(this.spellToReduce.id)) {
      this.XB_CDR_Used += this.spellUsable.reduceCooldown(
        this.spellToReduce.id,
        XUENS_BOND_REDUCTION,
      );
    } else {
      this.XB_CDR_Wasted += XUENS_BOND_REDUCTION;
    }
  }
  trackSummons(event: SummonEvent) {
    this.cloneMap.set(event.targetID, event.ability.guid);
  }
  handleMelee(event: DamageEvent) {
    //if we don't know who its from then we can't add it
    if (!event.sourceID) {
      return;
    }
    const id: number = event.sourceID;
    const cloneType: number | undefined = this.cloneMap.get(id);
    if (cloneType === undefined) {
      return;
    }

    if (cloneType === SPELLS.INVOKE_XUEN_THE_WHITE_TIGER.id) {
      this.totalDamage += calculateEffectiveDamage(event, this.XB_MOD);
    }
  }
  onXCTLDamage(event: DamageEvent) {
    this.totalDamage += calculateEffectiveDamage(event, this.XB_MOD);
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(13)}
        size="flexible"
        category={STATISTIC_CATEGORY.COVENANTS}
        tooltip={
          <>
            The {formatPercentage(this.XB_MOD)}% increase from Xuens Bond was worth ~
            {formatNumber(this.totalDamage)} raw Damage.
          </>
        }
      >
        <ConduitSpellText spellId={SPELLS.XUENS_BOND.id}>
          <ItemDamageDone amount={this.totalDamage} />
          <br />
          <UptimeIcon /> {formatMilliseconds(this.XB_CDR_Used)} <small>Effective CDR</small>
          <br />
          <UptimeIcon /> {formatMilliseconds(this.XB_CDR_Wasted)} <small>Wasted CDR</small>
        </ConduitSpellText>
      </Statistic>
    );
  }
}

export default XuensBond;