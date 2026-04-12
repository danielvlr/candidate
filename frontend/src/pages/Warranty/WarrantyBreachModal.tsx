import React, { useState } from 'react';
import { Modal, Textarea, useToast } from '../../components/ui';
import { apiService } from '../../services/api';

interface WarrantyBreachModalProps {
  warrantyId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WarrantyBreachModal: React.FC<WarrantyBreachModalProps> = ({
  warrantyId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      addToast({ type: 'error', title: 'Informe o motivo da quebra de garantia' });
      return;
    }

    setLoading(true);
    try {
      await apiService.breachWarranty(warrantyId, reason.trim());
      addToast({ type: 'success', title: 'Quebra de garantia registrada com sucesso' });
      setReason('');
      onSuccess();
      onClose();
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao registrar quebra de garantia' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Quebra de Garantia"
      confirmLabel="Confirmar Quebra"
      cancelLabel="Cancelar"
      onConfirm={handleConfirm}
      variant="danger"
      loading={loading}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Descreva o motivo da quebra de garantia. Esta ação não pode ser desfeita.
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Descreva o motivo da quebra de garantia..."
          rows={4}
          disabled={loading}
        />
      </div>
    </Modal>
  );
};

export default WarrantyBreachModal;
