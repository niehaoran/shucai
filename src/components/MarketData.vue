<template>
  <div class="market-container">
    <div class="market-table-container">
      <h1>重庆双福国际农贸城 - 农产品市场行情</h1>

      <!-- 日期选择下拉框 -->
      <div class="date-selector">
        <label for="selectedDate">选择日期：</label>
        <select v-model="selectedDate" id="selectedDate">
          <option v-for="date in availableDates" :key="date" :value="date">
            {{ date }}
          </option>
        </select>
      </div>

      <!-- 加载中提示 -->
      <div v-if="loading" class="loading-container">
        <p>数据加载中，请稍候...</p>
      </div>

      <!-- 数据内容显示 -->
      <div v-else>
        <!-- 蔬菜搜索和价格变化展示 -->
        <div class="price-change-container">
          <h2>蔬菜价格查询</h2>
          <div class="input-group">
            <label for="searchVariety">输入蔬菜名称：</label>
            <input v-model="searchVariety" id="searchVariety" placeholder="输入蔬菜品种进行搜索">
          </div>
          <div v-if="priceChange && matchedVariety">
            <p><strong>当前蔬菜：</strong> {{ matchedVariety }}</p>
            <p>当前价格：{{ priceChange.currentPrice }} 元/公斤</p>
            <p>前日价格：{{ priceChange.previousPrice }} 元/公斤</p>
            <p>价格变化：<span :class="priceChange.change > 0 ? 'price-up' : 'price-down'">{{ priceChange.change }} 元</span>
            </p>
          </div>
        </div>

        <!-- 日期分组表格展示 -->
        <div class="tables-wrapper">
          <div v-if="filteredData.length" class="table-group">
            <h2 class="date-title">{{ selectedDate }}</h2>
            <el-table :data="filteredData" border style="min-width: 300px;">
              <el-table-column prop="variety" label="蔬菜品种" width="180"></el-table-column>
              <el-table-column prop="pricePerKg" label="每公斤价格 (元)" width="180"></el-table-column>
              <el-table-column prop="pricePerJin" label="每斤价格 (元)" width="180"></el-table-column>
              <el-table-column prop="market" label="市场" min-width="200"></el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 总体价格趋势图 -->
        <div v-if="trendData.length" class="chart-container">
          <h2>蔬菜总体价格趋势</h2>
          <div ref="trendChart" style="width: 100%; height: 400px;"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import api from '@/services/api';

export default {
  setup() {
    const marketData = ref([]);
    const searchVariety = ref("");
    const priceChange = ref(null);
    const trendData = ref([]); // 用于存储总体价格趋势的数据
    const trendChart = ref(null); // ECharts 图表的引用
    const loading = ref(true); // 用于显示加载状态
    const selectedDate = ref(""); // 选择的日期
    const matchedVariety = ref(""); // 用于存储实际匹配到的蔬菜品种

    onMounted(async () => {
      try {
        const response = await api.get('/market');
        marketData.value = response.data;
        generateTrendData(); // 生成总体价格趋势数据

        // 设置默认日期为最新日期
        if (availableDates.value.length > 0) {
          selectedDate.value = availableDates.value[0];
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        loading.value = false;
      }

      // 在 nextTick 中初始化图表
      nextTick(() => {
        initTrendChart();
      });
    });

    // 按日期分组数据
    const groupedData = computed(() => {
      return marketData.value.reduce((groups, item) => {
        const date = item.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(item);
        return groups;
      }, {});
    });

    // 提取所有可用的日期选项
    const availableDates = computed(() => Object.keys(groupedData.value).sort((a, b) => new Date(b) - new Date(a)));

    // 根据选定日期过滤数据
    const filteredData = computed(() => groupedData.value[selectedDate.value] || []);

    // 监视 searchVariety 变化以计算价格变化
    watch(searchVariety, calculatePriceChange);

    function calculatePriceChange() {
      if (!searchVariety.value) {
        priceChange.value = null;
        matchedVariety.value = "";
        return;
      }

      const selectedData = marketData.value
        .filter(item => item.variety.toLowerCase().includes(searchVariety.value.toLowerCase()))  // 模糊匹配
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (selectedData.length >= 2) {
        const currentPrice = selectedData[0].pricePerKg;
        const previousPrice = selectedData[1].pricePerKg;
        priceChange.value = {
          currentPrice,
          previousPrice,
          change: (currentPrice - previousPrice).toFixed(2),
        };
        matchedVariety.value = selectedData[0].variety; // 更新为实际匹配到的蔬菜品种
      } else {
        priceChange.value = null;
        matchedVariety.value = "";
      }
    }

    // 准备总体价格趋势数据
    function generateTrendData() {
      // 根据日期累加每日期总价格
      const trendDataMap = marketData.value.reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) acc[date] = 0;
        acc[date] += item.pricePerKg;
        return acc;
      }, {});

      trendData.value = Object.entries(trendDataMap)
        .map(([date, totalPrice]) => ({ date, totalPrice }));

      console.log("Generated trendData:", trendData.value); // 输出生成的 trendData 以便调试
    }

    // 初始化趋势图
    function initTrendChart() {
      if (!trendChart.value) return;

      const chartInstance = echarts.init(trendChart.value);

      // 初始设置空图表
      chartInstance.setOption({
        title: { text: '蔬菜总体价格趋势' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value', name: '总价格 (元)' },
        series: [{
          data: [],
          type: 'line',
          smooth: true
        }]
      });

      watch(
        () => trendData.value,
        (newData) => {
          if (newData.length > 0) {
            const dates = newData.map(entry => entry.date);
            const prices = newData.map(entry => entry.totalPrice);

            console.log("Updating chart with dates:", dates, "and prices:", prices); // 调试日志

            chartInstance.setOption({
              xAxis: { data: dates },
              series: [{
                data: prices
              }]
            });
          }
        },
        { immediate: true }
      );
    }

    return {
      marketData,
      groupedData,
      availableDates,
      selectedDate,
      filteredData,
      searchVariety,
      priceChange,
      trendData,
      trendChart,
      loading,
      matchedVariety, // 返回给模板使用
    };
  },
};
</script>

<style scoped>
.market-container {
  display: flex;
  justify-content: center;
  padding: 10px;
  margin: 0 auto;
  max-width: 1200px;
}

.market-table-container {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;
  max-width: 900px;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
}

.loading-container {
  text-align: center;
  font-size: 18px;
  color: #409eff;
  padding: 20px;
}

.date-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.date-selector label {
  font-size: 16px;
  margin-right: 10px;
}

.date-selector select {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.price-change-container {
  padding: 20px;
  background-color: #f9f9f9;
  margin-bottom: 20px;
  border-radius: 8px;
  text-align: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.input-group label {
  font-size: 16px;
  margin-bottom: 5px;
}

.input-group input {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.tables-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-group {
  width: 100%;
  margin-bottom: 30px;
}

.date-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  background-color: #f0f9ff;
  padding: 8px;
  border-radius: 5px;
  margin: 0 0 10px;
}

.el-table {
  font-size: 14px;
}

.el-table th,
.el-table td {
  text-align: center;
}

.chart-container {
  width: 100%;
  margin: 30px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.price-up {
  color: red;
}

.price-down {
  color: green;
}

.price-change-container p strong {
  font-weight: bold;
  font-size: 16px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  h1 {
    font-size: 20px;
  }

  .price-change-container,
  .chart-container {
    padding: 15px;
  }

  .input-group label,
  .date-selector label {
    font-size: 14px;
  }

  .input-group input,
  .date-selector select {
    font-size: 12px;
  }

  .date-title {
    font-size: 16px;
  }

  .el-table {
    font-size: 12px;
  }
}

.chart-container {
  width: 100%;
  max-width: 1000px;
  height: 400px;
  margin: 30px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
</style>
