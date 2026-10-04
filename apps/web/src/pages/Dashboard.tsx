import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Plus,
  Archive,
  CalendarBlank,
  Users,
  GearSix,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useState } from "react";
import { budgetSummary, money, type TripRecord } from "@whereto/shared";
import { api, post, ApiError } from "../lib/api";
import { Doodle, Logo } from "../components/Doodle";
import { Button, Empty, Notice } from "../components/ui";
import { SeekSearch } from "../components/PlayfulControls";
import { searchText } from "../components/TripSearch";
import GuidedHelp from "../components/GuidedHelp";
import { AnimatePresence, motion } from "motion/react";
import {
  MotionChoice,
  MotionGroup,
  Reveal,
  RollingValue,
  softSpring,
  useInstantMotion,
} from "../components/motion";
const MotionLink = motion.create(Link);
export default function Dashboard() {
  const navigate = useNavigate();
  const instant = useInstantMotion();
  const query = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const me = useQuery({ queryKey: ["me"], queryFn: () => api("/me") });
  const trips = useQuery({
    queryKey: ["trips"],
    queryFn: () => api<TripRecord[]>("/trips"),
    enabled: !!me.data,
  });
  const visibleTrips =
    trips.data?.filter(
      (trip) =>
        !!trip.archivedAt === showArchived &&
        searchText(
          `${trip.state.title} ${trip.state.destinations.map((place) => place.name).join(" ")}`,
        ).includes(searchText(search)),
    ) ?? [];
  if (me.error instanceof ApiError && [401, 403].includes(me.error.status))
    return <Navigate to="/login" />;
  return (
    <div className="dashboard">
      <header className="app-header">
        <Link to="/">
          <Logo />
        </Link>
        <div>
          <Link to="/pricing" className="plan-label">
            {me.data?.pro
              ? "Whereto Plus"
              : me.data?.tripCredits
                ? `${me.data.tripCredits} bonus trip credits`
                : me.data?.entitlement?.freeTripClaimedAt
                  ? "Free trip claimed"
                  : "First trip free"}
          </Link>
          <Link
            className="icon-button"
            to="/app/settings"
            aria-label="Account settings"
          >
            <GearSix size={21} />
          </Link>
        </div>
      </header>
      <main className="dashboard-main">
        {me.data && (
          <GuidedHelp
            scope="dashboard"
            userId={me.data.user.id}
            onAction={(action) =>
              navigate(action === "new" ? "/app/new" : "/app/settings")
            }
          />
        )}
        <Reveal className="dashboard-greeting">
          <div>
            <span className="eyebrow">YOUR WORLD, READY TO EXPLORE</span>
            <h1>
              Where to next
              {me.data?.user.name ? `, ${me.data.user.name.split(" ")[0]}` : ""}
              ?
            </h1>
            <p className="muted">
              From a weekend away to a month on the road. A place for all your
              plans.
            </p>
          </div>
          <Doodle name="sun" flow colour="#FFD69A" />
        </Reveal>
        <div className="toolbar">
          <div className="segmented">
            <MotionGroup>
              <MotionChoice
                active={!showArchived}
                onClick={() => setShowArchived(false)}
              >
                Your trips
              </MotionChoice>
              <MotionChoice
                active={showArchived}
                onClick={() => setShowArchived(true)}
              >
                Archived
              </MotionChoice>
            </MotionGroup>
          </div>
          <Link
            className="button button-primary"
            to={
              me.data?.entitlement?.freeTripClaimedAt &&
              !me.data.pro &&
              !me.data.tripCredits
                ? "/pricing"
                : "/app/new"
            }
          >
            <Plus size={19} /> Plan a trip
          </Link>
        </div>
        {me.error && <Notice error>{me.error.message}</Notice>}
        <div className="dashboard-search-row">
          <span role="status">
            {visibleTrips.length} {visibleTrips.length === 1 ? "trip" : "trips"}
          </span>
          <SeekSearch
            label="Search trips"
            placeholder="Trip name or destination…"
            value={search}
            onChange={setSearch}
          />
        </div>
        {trips.isPending && <p className="muted">Finding your trips…</p>}
        <div className="trip-grid">
          <AnimatePresence initial={false} mode="popLayout">
            {visibleTrips.map((trip, i) => {
              const summary = budgetSummary(trip.state);
              return (
                <motion.article
                  className="trip-card"
                  key={trip.id}
                  layout={instant ? false : "position"}
                  initial={instant ? false : { opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: instant ? 1 : 0.96,
                    transition: { duration: instant ? 0 : 0.16 },
                  }}
                  transition={instant ? { duration: 0 } : softSpring}
                >
                  <Link
                    to={`/app/trips/${trip.id}`}
                    className={`trip-art trip-art-${i % 3}`}
                  >
                    <Doodle
                      name={(["map", "suitcase", "plane"] as const)[i % 3]}
                      colour={["#FFD69A", "#CDE5D4", "#CBDDF0"][i % 3]}
                    />
                    <span className="tag white">
                      {trip.isFree
                        ? "Your free trip"
                        : trip.role === "owner"
                          ? "Your adventure"
                          : "Shared with you"}
                    </span>
                  </Link>
                  <div className="trip-card-body">
                    <Link to={`/app/trips/${trip.id}`}>
                      <h2>{trip.state.title}</h2>
                    </Link>
                    <p>
                      {trip.state.destinations.map((d) => d.name).join(" · ")}
                    </p>
                    <div className="trip-meta">
                      <span>
                        <CalendarBlank size={16} />
                        {new Date(
                          trip.state.startDate + "T12:00",
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        –{" "}
                        {new Date(
                          trip.state.endDate + "T12:00",
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>
                        <Users size={16} />
                        {trip.state.participants.length}
                      </span>
                    </div>
                    <div className="trip-bottom">
                      <span>
                        <RollingValue>
                          {money(summary.total, trip.state.currency)}
                        </RollingValue>{" "}
                        <small>planned</small>
                      </span>
                      <Link
                        to={`/app/trips/${trip.id}`}
                        aria-label={`Open ${trip.state.title}`}
                      >
                        <ArrowUpRight size={24} />
                      </Link>
                    </div>
                    {trip.role === "owner" && (
                      <button
                        className="plain-link archive-link"
                        onClick={async () => {
                          try {
                            await post(`/trips/${trip.id}/archive`, {
                              archived: !trip.archivedAt,
                            });
                            await query.invalidateQueries({
                              queryKey: ["trips"],
                            });
                          } catch (e) {
                            toast.error((e as Error).message);
                          }
                        }}
                      >
                        <Archive size={14} />
                        {trip.archivedAt ? "Restore trip" : "Archive"}
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
            {!showArchived && !search.trim() && (
              <MotionLink
                key="new-trip"
                layout={instant ? false : "position"}
                transition={instant ? { duration: 0 } : softSpring}
                className="new-trip-card"
                to={
                  me.data?.entitlement?.freeTripClaimedAt &&
                  !me.data.pro &&
                  !me.data.tripCredits
                    ? "/pricing"
                    : "/app/new"
                }
              >
                <span className="new-trip-plus">
                  <Plus size={28} />
                </span>
                <h2>Plan your next trip.</h2>
                <p>
                  {me.data?.entitlement?.freeTripClaimedAt
                    ? "There’s always somewhere else to go."
                    : "Your first trip is on us. No card needed."}
                </p>
                <span>
                  Let’s make a plan <ArrowUpRight size={17} />
                </span>
              </MotionLink>
            )}
          </AnimatePresence>
          {search.trim() && !visibleTrips.length && !trips.isPending && (
            <div className="dashboard-search-empty">
              <p>No trips match “{search.trim()}”.</p>
              <button type="button" onClick={() => setSearch("")}>
                Clear search
              </button>
            </div>
          )}
        </div>
        {showArchived &&
          !search.trim() &&
          trips.data?.every((t) => !t.archivedAt) && (
            <Empty title="No adventures tucked away yet.">
              Archived trips will appear here, ready whenever you need them.
            </Empty>
          )}
        <div className="dashboard-tip">
          <Doodle name="wallet" colour="#CDE5D4" />
          <div>
            <strong>Less guesswork.</strong>
            <p>
              Add something to your itinerary and its cost follows along. Every
              detail, counted once.
            </p>
            <Link to="/demo" className="text-link">
              Explore an example trip <ArrowUpRight size={17} />
            </Link>
          </div>
          {me.data?.entitlement?.stripeCustomerId && (
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const { url } = await post("/billing/portal", {});
                  window.location.assign(url);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Manage subscription
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
