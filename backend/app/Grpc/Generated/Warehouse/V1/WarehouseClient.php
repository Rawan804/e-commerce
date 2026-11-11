<?php
// GENERATED CODE -- DO NOT EDIT!

namespace Warehouse\V1;

/**
 * العقد المشترك بين التطبيق الأساسي (Laravel) وخدمة المستودع (Python)
 */
class WarehouseClient extends \Grpc\BaseStub {

    /**
     * @param string $hostname hostname
     * @param array $opts channel options
     * @param \Grpc\Channel $channel (optional) re-use channel object
     */
    public function __construct($hostname, $opts, $channel = null) {
        parent::__construct($hostname, $opts, $channel);
    }

    /**
     * كم بقي من هذا المنتج؟
     * @param \Warehouse\V1\GetStockRequest $argument input argument
     * @param array $metadata metadata
     * @param array $options call options
     * @return \Grpc\UnaryCall
     */
    public function GetStock(\Warehouse\V1\GetStockRequest $argument,
      $metadata = [], $options = []) {
        return $this->_simpleRequest('/warehouse.v1.Warehouse/GetStock',
        $argument,
        ['\Warehouse\V1\GetStockResponse', 'decode'],
        $metadata, $options);
    }

    /**
     * احجز كميات كل منتجات الطلب بطلب واحد: كلها أو لا شيء
     * @param \Warehouse\V1\ReserveStockRequest $argument input argument
     * @param array $metadata metadata
     * @param array $options call options
     * @return \Grpc\UnaryCall
     */
    public function ReserveStock(\Warehouse\V1\ReserveStockRequest $argument,
      $metadata = [], $options = []) {
        return $this->_simpleRequest('/warehouse.v1.Warehouse/ReserveStock',
        $argument,
        ['\Warehouse\V1\ReserveStockResponse', 'decode'],
        $metadata, $options);
    }

    /**
     * أعد الكميات المحجوزة (إذا فشل حفظ الطلب). آمن لو انعادت أكثر من مرة
     * @param \Warehouse\V1\ReleaseStockRequest $argument input argument
     * @param array $metadata metadata
     * @param array $options call options
     * @return \Grpc\UnaryCall
     */
    public function ReleaseStock(\Warehouse\V1\ReleaseStockRequest $argument,
      $metadata = [], $options = []) {
        return $this->_simpleRequest('/warehouse.v1.Warehouse/ReleaseStock',
        $argument,
        ['\Warehouse\V1\ReleaseStockResponse', 'decode'],
        $metadata, $options);
    }

}
