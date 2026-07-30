import React from 'react';
import { ServiceLog } from '../types/fuel';
import { Wrench, Plus, ExternalLink } from 'lucide-react';

import { AnimatedActionButton } from './AnimatedActionButton';

interface ServiceLogsViewProps {
  services: ServiceLog[];
  isOwnerMode: boolean;
  onOpenAddModal: () => void;
}

export const ServiceLogsView: React.FC<ServiceLogsViewProps> = ({ services, isOwnerMode, onOpenAddModal }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Service History</h2>
          <p className="text-sm text-slate-500 mt-1">Keep track of your bike's maintenance and repairs.</p>
        </div>
        <AnimatedActionButton label="Add Service" onClick={onOpenAddModal} />
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No services logged yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Log your regular services, oil changes, and repairs to maintain a full history.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">{service.serviceType}</h3>
                  <p className="text-sm text-slate-500">{new Date(service.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {service.odometer.toLocaleString()} km
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {service.serviceCenter && (
                  <div className="text-sm">
                    <span className="text-slate-500">Center: </span>
                    <span className="font-medium text-slate-900">{service.serviceCenter}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-slate-500">Cost: </span>
                  <span className="font-medium text-slate-900">₹{service.totalCost.toLocaleString()}</span>
                </div>
                {service.notes && (
                  <div className="text-sm">
                    <span className="text-slate-500">Notes: </span>
                    <span className="text-slate-700">{service.notes}</span>
                  </div>
                )}
              </div>

              {service.documentUrl && (
                <div className="pt-4 border-t border-slate-100">
                  <a
                    href={service.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    View Bill/Document
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
