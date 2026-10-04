import { Select, SelectOption } from "./Select";
import { useState } from "react";
import { Plus, ArrowRight, Check, WarningCircle } from "@phosphor-icons/react";
import {
  budgetSummary,
  itemTotal,
  itemPaid,
  costStatus,
  money,
  CATEGORY_COLORS,
  suggestedSettlements,
  makeId,
  type TripState,
  type TripItem,
  type Command,
} from "@whereto/shared";
import { Doodle } from "./Doodle";
import { Button, Field, Notice } from "./ui";
import { MotionPanel, RollingValue } from "./motion";
export function Donut({ state }: { state: TripState }) {
  const summary = budgetSummary(state);
  const entries = Object.entries(summary.categories).filter(
    ([, v]) => Number(v) > 0,
  );
  let start = 0;
  const stops = entries.map(([category, value]) => {
    const a = start;
    start += (Number(value) / Math.max(1, Number(summary.total))) * 100;
    return `${CATEGORY_COLORS[category] ?? "#dedbd2"} ${a}% ${start}%`;
  });
  return (
    <div className="budget-donut-card">
      <span className="eyebrow">THE FULL PICTURE</span>
      <div
        className="budget-donut"
        role="img"
        aria-label={`Planned total ${money(summary.total, state.currency)} across ${entries.length} categories`}
        style={{
          background: stops.length
            ? `conic-gradient(${stops.join(",")})`
            : "#edeae2",
        }}
      >
        <div>
          <small>Total planned</small>
          <strong>
            <RollingValue>{money(summary.total, state.currency)}</RollingValue>
          </strong>
          <span>for {state.participants.length} travellers</span>
        </div>
      </div>
      <div className="donut-legend">
        {entries.map(([category, value]) => (
          <div key={category}>
            <i style={{ background: CATEGORY_COLORS[category] ?? "#dedbd2" }} />
            <span>{category}</span>
            <strong>{money(value, state.currency)}</strong>
          </div>
        ))}
      </div>
      {summary.margin !== null && (
        <div
          className={`budget-margin ${Number(summary.margin) < 0 ? "over" : ""}`}
        >
          <Check size={18} />
          {money(Math.abs(Number(summary.margin)), state.currency)}{" "}
          {Number(summary.margin) < 0
            ? "over your budget"
            : "room for extras"}
        </div>
      )}
    </div>
  );
}
export default function BudgetView({
  state,
  onEdit,
  onAdd,
  onCommand,
  readOnly = false,
}: {
  state: TripState;
  onEdit: (i: TripItem) => void;
  onAdd: () => void;
  onCommand: (c: Command) => Promise<void>;
  readOnly?: boolean;
}) {
  const summary = budgetSummary(state);
  const [filter, setFilter] = useState("All"),
    [saved, setSaved] = useState(state.saved),
    [reserve, setReserve] = useState(state.reserve);
  const suggestions = suggestedSettlements(state);
  const months = Math.max(
    1,
    Math.ceil((Date.parse(state.startDate) - Date.now()) / (86400000 * 30)),
  );
  const needed = Math.max(
    0,
    Number(summary.remaining) + Number(state.reserve) - Number(state.saved),
  );
  const items = state.items.filter(
    (i) =>
      !i.deletedAt &&
      i.state !== "idea" &&
      (filter === "All" || i.category === filter),
  );
  return (
    <div className="budget-layout">
      <div className="budget-main">
        <div className="view-title">
          <div>
            <span className="eyebrow">KNOW WHERE YOUR BUDGET STANDS</span>
            <h2>The numbers, together.</h2>
            <p className="muted">Your whole trip. Every cost accounted for.</p>
          </div>
          {!readOnly && (
            <Button onClick={onAdd}>
              <Plus size={18} /> Add expense
            </Button>
          )}
        </div>
        <div className="budget-stats">
          {[
            ["Your budget", state.budget],
            ["Planned", summary.total],
            ["Paid, after refunds", summary.paid],
            ["Still to pay", summary.remaining],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>
                <RollingValue>
                  {value === null
                    ? "Not set"
                    : money(value ?? 0, state.currency)}
                </RollingValue>
              </strong>
            </div>
          ))}
        </div>
        <div className="budget-explainer">
          <dl>
            <div>
              <dt>Estimated costs</dt>
              <dd>{money(summary.estimated, state.currency)}</dd>
            </div>
            <div>
              <dt>Confirmed costs</dt>
              <dd>{money(summary.confirmed, state.currency)}</dd>
            </div>
            <div>
              <dt>Payments & deposits</dt>
              <dd>{money(summary.payments, state.currency)}</dd>
            </div>
            <div>
              <dt>Refunds received</dt>
              <dd>{money(summary.refunds, state.currency)}</dd>
            </div>
          </dl>
          <p>
            Planned = estimates + confirmed costs. Payments reduce what’s left
            to pay; they never add another cost. A booking and a payment are
            tracked separately.
          </p>
          {Number(summary.overpaid) > 0 && (
            <p>
              <strong>
                {money(summary.overpaid, state.currency)} paid above recorded
                costs.
              </strong>{" "}
              Check for a refund or an updated cost. This doesn’t pay for
              another booking.
            </p>
          )}
        </div>
        {summary.unpriced > 0 && (
          <Notice>
            <WarningCircle size={18} />
            {summary.unpriced} planned{" "}
            {summary.unpriced === 1 ? "item needs" : "items need"} a cost
            estimate. Your total is still taking shape.
          </Notice>
        )}
        <div className="expense-heading">
          <h3>Every expense has a home.</h3>
          <Select
            aria-label="Filter expenses by category"
            value={filter}
            onValueChange={(nextValue) => setFilter(nextValue)}
          >
            <SelectOption>All</SelectOption>
            {state.categories.map((c) => (
              <SelectOption key={c}>{c}</SelectOption>
            ))}
          </Select>
        </div>
        <MotionPanel changeKey={filter} distance={0} className="expense-table">
          <div className="expense-table-header">
            <span>THE DETAILS</span>
            <span>PLANNED</span>
            <span>PAID</span>
          </div>
          {items.map((item) => (
            <button
              className="expense-row"
              key={item.id}
              onClick={() => onEdit(item)}
            >
              <span>
                <i
                  style={{
                    background: CATEGORY_COLORS[item.category] ?? "#dedbd2",
                  }}
                />
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.category} · {costStatus(item)}
                    {item.state === "booked" ? " · Booked" : ""}
                  </small>
                </span>
              </span>
              <strong>
                {item.lines.length
                  ? money(itemTotal(item), state.currency)
                  : "—"}
              </strong>
              <span>{money(itemPaid(item), state.currency)}</span>
            </button>
          ))}
          {!items.length && (
            <div className="empty">
              <h3>A fresh page for your pennies.</h3>
              <p>Costs added to your plan will appear here automatically.</p>
            </div>
          )}
          <div className="expense-total">
            <strong>Total for this trip</strong>
            <strong>{money(summary.total, state.currency)}</strong>
            <span>{money(summary.paid, state.currency)}</span>
          </div>
        </MotionPanel>
        <section className="splits-section">
          <h3>Keep it fair, keep it friendly.</h3>
          <p className="muted">
            Based on actual payments and the people joining each activity.
          </p>
          {suggestions.length ? (
            suggestions.map((s, i) => (
              <div className="settlement-row" key={i}>
                <span className="avatar">
                  {state.participants.find((p) => p.id === s.from)?.name[0]}
                </span>
                <span>
                  <strong>
                    {state.participants.find((p) => p.id === s.from)?.name}
                  </strong>{" "}
                  owes {state.participants.find((p) => p.id === s.to)?.name}
                </span>
                <strong>{money(s.amount, state.currency)}</strong>
                {!readOnly && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void onCommand({
                        type: "settlement",
                        settlement: {
                          ...s,
                          id: makeId(),
                          date: new Date().toISOString().slice(0, 10),
                        },
                      })
                    }
                  >
                    Mark settled
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="all-square">
              <Check size={20} />
              {state.items.some((i) => i.payments.length)
                ? "All square. Lovely."
                : "Record a shared payment to see who owes whom."}
            </div>
          )}
          {state.settlements.length > 0 && (
            <small className="muted">
              {state.settlements.length}{" "}
              {state.settlements.length === 1 ? "settlement" : "settlements"}{" "}
              recorded. These never add to the cost of your trip.
            </small>
          )}
        </section>
      </div>
      <aside className="budget-side">
        <Donut state={state} />
        <div className="savings-card">
          <Doodle name="wallet" colour="#CDE5D4" />
          <h3>Payment by payment.</h3>
          <p>
            Put aside {money(needed / months, state.currency)} a month for your
            remaining costs.
          </p>
          <Field label={`Already set aside (${state.currency})`}>
            <input
              disabled={readOnly}
              type="number"
              min="0"
              value={saved}
              onChange={(e) => setSaved(e.target.value)}
            />
          </Field>
          <Field label={`A cushion for surprises (${state.currency})`}>
            <input
              disabled={readOnly}
              type="number"
              min="0"
              value={reserve}
              onChange={(e) => setReserve(e.target.value)}
            />
          </Field>
          {!readOnly && (
            <Button
              variant="secondary"
              className="full-width"
              onClick={() =>
                void onCommand({
                  type: "settings",
                  patch: { saved: saved || "0", reserve: reserve || "0" },
                })
              }
            >
              Update savings <ArrowRight size={17} />
            </Button>
          )}
          <small>
            Savings and your reserve are kept separate from expenses.
          </small>
        </div>
      </aside>
    </div>
  );
}
