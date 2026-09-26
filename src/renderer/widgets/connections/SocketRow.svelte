<script lang="ts">
import type { NetSocket } from '@shared/metrics'
import { endpoint, maskAddress, STATE_LABEL, serviceOf } from '@shared/sockets'

/**
 * One socket: where it leaves this machine, where it goes, and what state it is
 * in.
 *
 * The link between the two ends is drawn rather than written - a rule with a
 * head on it - because the row is read left to right as a circuit, which is the
 * whole conceit of the pane. A peer out on the internet lights the rule; one on
 * this network leaves it dim, so the rows that matter stand out without a
 * colour having to be looked up.
 *
 * A row that has just gone is still drawn once (`gone`), struck through, so a
 * connection that opened and closed between two readings is seen at all.
 */
interface Props {
  socket: NetSocket
  /** Marked new by the widget's FreshTracker: plays the arrival wipe. */
  fresh?: boolean
  /** Gone since the last reading: drawn once more, then dropped. */
  gone?: boolean
  /** The country lit in the bus above, if this row is in it. */
  lit?: boolean
  /** Hide the second half of every address, for a screenshot. */
  mask?: boolean
  onhover: (code: string | null) => void
  onsettled?: (event: AnimationEvent) => void
}

const {
  socket,
  fresh = false,
  gone = false,
  lit = false,
  mask = false,
  onhover,
  onsettled,
}: Props = $props()

const address = $derived(mask ? maskAddress(socket.remoteAddress) : socket.remoteAddress)
const local = $derived(mask ? maskAddress(socket.localAddress) : socket.localAddress)
const service = $derived(serviceOf(socket.remotePort) || serviceOf(socket.localPort))
const listening = $derived(socket.state === 'listen')
</script>

<div
  class="row"
  role="listitem"
  class:fx-fresh={fresh}
  class:gone
  class:lit
  class:outside={socket.publicPeer}
  data-testid="connection-row"
  data-state={socket.state}
  data-country={socket.country}
  onpointerenter={() => onhover(socket.country || null)}
  onpointerleave={() => onhover(null)}
  onanimationend={onsettled}
  class:listen={listening}
>
  <span class="state" data-testid="connection-state">{STATE_LABEL[socket.state]}</span>
  {#if listening}
    <!-- No peer, so no circuit: the address it waits on takes the room. -->
    <span class="local bound" data-testid="connection-local">{endpoint(local, socket.localPort)}</span>
  {:else}
    <span class="local">:{socket.localPort}</span>
    <span class="link" aria-hidden="true"></span>
    <span class="remote" data-testid="connection-remote">{endpoint(address, socket.remotePort)}</span>
  {/if}
  <span class="service">{service}</span>
  <span class="country">{socket.country}</span>
</div>

<style>
.row {
  display: grid;
  grid-template-columns: 2.9em 4.6em 1.4em 1fr auto 1.8em;
  align-items: center;
  gap: 0 0.35em;
  padding: 0.05rem var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
  line-height: 1.45;
  color: var(--text-muted);
  white-space: nowrap;
}

.row.lit {
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.state {
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
}

.row[data-state='established'] .state {
  color: var(--ok);
}

.row[data-state='listen'] .state {
  color: var(--info);
}

.row[data-state='time-wait'] .state,
.row[data-state='close-wait'] .state,
.row[data-state='closing'] .state,
.row[data-state='last-ack'] .state {
  color: var(--warn);
}

.local {
  text-align: right;
  color: var(--text-muted);
}

/*
 * A listening row has one end. Its address - `0.0.0.0:49664`, `[::1]:42050` - is
 * longer than a bare port, and in the port's column it ran over the row.
 */
.row.listen {
  grid-template-columns: 2.9em 1fr auto 1.8em;
}

.local.bound {
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  color: var(--text);
}

/*
 * The circuit between the two ends: a rule with a head, pointing out of this
 * machine. Dim for a peer on this network, lit for one on the internet - the
 * distinction the pane is really about.
 */
.link {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--panel-rule));
  position: relative;
}

.link::after {
  content: '';
  position: absolute;
  right: 0;
  top: -2px;
  border: 2px solid transparent;
  border-left-color: var(--panel-rule);
}

.row.outside .link {
  background: linear-gradient(to right, transparent, var(--accent));
}

.row.outside .link::after {
  border-left-color: var(--accent);
}

.remote {
  overflow: hidden;
  text-overflow: ellipsis;
}

.row.outside .remote {
  color: var(--text);
}

.service {
  font-size: var(--step--2);
  letter-spacing: 0.04em;
  color: var(--accent-dim);
}

.country {
  text-align: right;
  font-size: var(--step--2);
  letter-spacing: 0.06em;
  color: var(--accent-strong);
}

/*
 * Gone since the last reading. Struck through rather than faded away, so a
 * connection that lasted less than one interval leaves something to read; the
 * next reading drops it.
 */
.gone {
  opacity: 0.45;
}

.gone .remote,
.gone .local {
  text-decoration: line-through;
  text-decoration-color: var(--text-muted);
}

.gone .link,
.gone .link::after {
  background: var(--line);
  border-left-color: var(--line);
}

/* The pane is narrow: the service and the country are the first things to go,
   since the address beside them already carries the port. */
@container (max-width: 25rem) {
  .row {
    grid-template-columns: 2.9em 4.6em 1.4em 1fr 1.8em;
  }

  .row.listen {
    grid-template-columns: 2.9em 1fr 1.8em;
  }

  .service {
    display: none;
  }
}

@container (max-width: 19rem) {
  .row {
    grid-template-columns: 2.9em 3.4em 1fr;
  }

  .row.listen {
    grid-template-columns: 2.9em 1fr;
  }

  .link,
  .country {
    display: none;
  }
}
</style>
