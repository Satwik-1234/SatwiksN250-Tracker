'use client';
import React from 'react';
import { Bike, ArrowRight, Gauge, Calendar, Clock, Fuel } from 'lucide-react';
import styles from './TicketCard.module.css';
import { Trip } from '../types/fuel';

export const TicketCard: React.FC<{ trip: Trip }> = ({ trip }) => {
  // Use explicit from/to location or fallback to name parsing
  let from = trip.fromLocation || '';
  let to = trip.toLocation || '';

  if (!from || !to) {
    const lowerName = trip.name.toLowerCase();
    if (lowerName.includes(' to ')) {
      const parts = trip.name.split(/ to /i);
      from = from || parts[0].trim();
      to = to || parts[1].trim();
    } else if (trip.name.includes('-')) {
      const parts = trip.name.split('-');
      from = from || parts[0].trim();
      to = to || parts[1].trim();
    } else {
      from = from || 'HOME';
      to = to || trip.name;
    }
  }

  const fromAcronym = from.substring(0, 3).toUpperCase();
  const toAcronym = to.substring(0, 3).toUpperCase();

  const distance =
    trip.distanceCovered ||
    trip.totalDistance ||
    (trip.endOdometer && trip.startOdometer ? trip.endOdometer - trip.startOdometer : 0);

  const departureDateStr = trip.departureDate || trip.startDate || '';
  const departureTimeStr = trip.departureTime ? trip.departureTime.substring(0, 5) : '';
  const arrivalDateStr = trip.arrivalDate || trip.endDate || departureDateStr;
  const arrivalTimeStr = trip.arrivalTime ? trip.arrivalTime.substring(0, 5) : '';

  const actualMileage =
    trip.calculatedFuelEconomy ||
    trip.avgMileage ||
    (distance > 0 && trip.totalFuelLitres > 0
      ? Number((distance / trip.totalFuelLitres).toFixed(2))
      : undefined);

  const midMileage = trip.avgFuelEconomy;

  return (
    <div className={styles.containerCardsTicket}>
      <div className={styles.cardTicket}>
        <div className={styles.containerIcons}>
          <Bike className={styles.icon} size={28} />
        </div>

        <div className={styles.separator}>
          <div className={styles.spanLines}></div>
        </div>

        <div className={styles.contentTicket}>
          <div className={styles.contentData}>
            <div className={styles.dataFlex}>
              <div className={styles.data}>
                <p className={styles.title}>RIDE TYPE</p>
                <p className={styles.subtitle}>{trip.tripType.toUpperCase()}</p>
              </div>
              <div className={`${styles.data} text-right`}>
                <p className={styles.title}>DISTANCE</p>
                <p className={styles.subtitle}>{distance > 0 ? `${distance} km` : 'N/A'}</p>
              </div>
            </div>

            <div className={styles.destination}>
              <div className={styles.dest}>
                <p className={styles.country} title={from}>{from}</p>
                <p className={styles.acronym}>{fromAcronym}</p>
                <p className={styles.hour}>
                  {departureDateStr}
                  {departureTimeStr && <span className="ml-1 text-[10px] text-slate-400">({departureTimeStr})</span>}
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center opacity-40 px-2 mt-2">
                <div className="w-full border-t border-dashed border-slate-400 relative">
                  <ArrowRight
                    size={14}
                    className="absolute left-1/2 -top-[7px] -translate-x-1/2 text-slate-500"
                  />
                </div>
              </div>

              <div className={`${styles.dest} text-right`}>
                <p className={styles.country} title={to}>{to}</p>
                <p className={styles.acronym}>{toAcronym}</p>
                <p className={`${styles.hour} justify-end`}>
                  {arrivalDateStr}
                  {arrivalTimeStr && <span className="ml-1 text-[10px] text-slate-400">({arrivalTimeStr})</span>}
                </p>
              </div>
            </div>

            {/* Fuel Economy & Cost Matrix */}
            <div className={styles.dataFlex}>
              <div className={styles.data}>
                <p className={styles.title}>FUEL COST</p>
                <p className={styles.subtitle}>
                  ₹{trip.totalFuelCost.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    ({trip.totalFuelLitres}L)
                  </span>
                </p>
              </div>
              <div className={`${styles.data} text-right`}>
                <p className={styles.title}>CALC ECONOMY</p>
                <p className={`${styles.subtitle} text-emerald-400`}>
                  {actualMileage ? `${actualMileage} km/L` : '—'}
                </p>
                {midMileage !== undefined && midMileage !== null && (
                  <p className="text-[10px] font-mono text-slate-400">
                    MID: <span className="text-cyan-400 font-semibold">{midMileage} km/L</span>
                  </p>
                )}
              </div>
            </div>

            {trip.notes && (
              <p className="text-[10px] text-slate-400 italic truncate mt-1 border-t border-slate-800/60 pt-1">
                {trip.notes}
              </p>
            )}
          </div>

          <div className={styles.barcodeSection}>
            <div className={styles.barcode} />
            <span className={styles.barcodeText}>
              {trip.id.replace(/-/g, '').substring(0, 10).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
