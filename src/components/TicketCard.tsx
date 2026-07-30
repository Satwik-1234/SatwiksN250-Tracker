'use client';
import React from 'react';
import { Bike, ArrowRight } from 'lucide-react';
import styles from './TicketCard.module.css';
import { Trip } from '../types/fuel';

export const TicketCard: React.FC<{ trip: Trip }> = ({ trip }) => {
  // Parse "From to To" from trip.name
  let from = "HOME";
  let to = trip.name;
  let fromAcronym = "HOM";
  let toAcronym = to.substring(0, 3).toUpperCase();

  const lowerName = trip.name.toLowerCase();
  if (lowerName.includes(' to ')) {
    const parts = trip.name.split(/ to /i);
    from = parts[0].trim();
    to = parts[1].trim();
    fromAcronym = from.substring(0, 3).toUpperCase();
    toAcronym = to.substring(0, 3).toUpperCase();
  } else if (trip.name.includes('-')) {
    const parts = trip.name.split('-');
    from = parts[0].trim();
    to = parts[1].trim();
    fromAcronym = from.substring(0, 3).toUpperCase();
    toAcronym = to.substring(0, 3).toUpperCase();
  }
  
  const distance = trip.totalDistance || (trip.endOdometer && trip.startOdometer ? trip.endOdometer - trip.startOdometer : 0);

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
                <p className={styles.title}>TYPE</p>
                <p className={styles.subtitle}>{trip.tripType.toUpperCase()}</p>
              </div>
              <div className={`${styles.data} text-right`}>
                <p className={styles.title}>DISTANCE</p>
                <p className={styles.subtitle}>{distance > 0 ? `${distance} km` : 'N/A'}</p>
              </div>
            </div>

            <div className={styles.destination}>
              <div className={styles.dest}>
                <p className={styles.country}>{from}</p>
                <p className={styles.acronym}>{fromAcronym}</p>
                <p className={styles.hour}>{trip.startDate}</p>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 px-2 mt-2">
                 <div className="w-full border-t border-dashed border-slate-400 relative">
                   <ArrowRight size={14} className="absolute left-1/2 -top-[7px] -translate-x-1/2 text-slate-500" />
                 </div>
              </div>

              <div className={`${styles.dest} text-right`}>
                <p className={styles.country}>{to}</p>
                <p className={styles.acronym}>{toAcronym}</p>
                <p className={`${styles.hour} justify-end`}>{trip.endDate || trip.startDate}</p>
              </div>
            </div>

            <div className={styles.dataFlex}>
              <div className={styles.data}>
                <p className={styles.title}>COST</p>
                <p className={styles.subtitle}>₹{trip.totalFuelCost.toLocaleString()}</p>
              </div>
              <div className={`${styles.data} text-right`}>
                <p className={styles.title}>MILEAGE</p>
                <p className={styles.subtitle}>{trip.avgMileage ? `${trip.avgMileage} km/L` : '—'}</p>
              </div>
            </div>

          </div>

          <div className={styles.barcodeSection}>
            <div className={styles.barcode} />
            <span className={styles.barcodeText}>{trip.id.replace(/-/g, '').substring(0, 10).toUpperCase()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
