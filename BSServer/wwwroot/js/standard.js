var detectStandard = [{
        pollutantCode: 'SO2',
        tasks: [{ name: '零点噪声', taskType: 'SO2_零点噪声', detect: '≤1ppb' },
            { name: '最低检出限', taskType: 'SO2_最低检出限', detect: '≤2ppb' },
            { name: '量程噪声', taskType: 'SO2_量程噪声', detect: '≤5ppb' },
            { name: '示值误差', taskType: 'SO2_示值误差', detect: '±2%F.S' },
            { name: '20%量程精密度', taskType: 'SO2_量程精密度', detect: '≤5ppb' },
            { name: '80%量程精密度', taskType: 'SO2_量程精密度', detect: '≤10ppb' },
            { name: '24h零点漂移', taskType: 'SO2_24h零点漂移', detect: '±5ppb' },
            { name: '24h20%量程漂移', taskType: 'SO2_24h量程漂移', detect: '±5ppb' },
            { name: '24h80%量程漂移', taskType: 'SO2_24h量程漂移', detect: '±10ppb' },
            { name: '响应时间', taskType: 'SO2_响应时间', detect: '≤5min' },
            { name: '电压稳定性', taskType: 'SO2_电压稳定性', detect: '±1%F.S' },
            { name: '流量稳定性', taskType: 'SO2_流量稳定性', detect: '±10%' },
            { name: '环境温度变化的影响', taskType: 'SO2_环境温度变化的影响', detect: '≤1ppb/℃' },
            { name: '转换效率', taskType: 'SO2_转换效率', detect: '/' }
        ]
    },
    {
        pollutantCode: 'NO2',
        tasks: [{ name: '零点噪声', taskType: 'NO2_零点噪声', detect: '≤1ppb' },
            { name: '最低检出限', taskType: 'NO2_最低检出限', detect: '≤2ppb' },
            { name: '量程噪声', taskType: 'NO2_量程噪声', detect: '≤5ppb' },
            { name: '示值误差', taskType: 'NO2_示值误差', detect: '±2%F.S' },
            { name: '20%量程精密度', taskType: 'NO2_量程精密度', detect: '≤5ppb' },
            { name: '80%量程精密度', taskType: 'NO2_量程精密度', detect: '≤10ppb' },
            { name: '24h零点漂移', taskType: 'NO2_24h零点漂移', detect: '±5ppb' },
            { name: '24h20%量程漂移', taskType: 'NO2_24h量程漂移', detect: '±5ppb' },
            { name: '24h80%量程漂移', taskType: 'NO2_24h量程漂移', detect: '±10ppb' },
            { name: '响应时间', taskType: 'NO2_响应时间', detect: '≤5min' },
            { name: '电压稳定性', taskType: 'NO2_电压稳定性', detect: '±1%F.S' },
            { name: '流量稳定性', taskType: 'NO2_流量稳定性', detect: '±10%' },
            { name: '环境温度变化的影响', taskType: 'NO2_环境温度变化的影响', detect: '≤3ppb/℃' },
            { name: '转换效率', taskType: 'NO2_转换效率', detect: '>96%' }
        ]
    },
    {
        pollutantCode: 'O3',
        tasks: [{ name: '零点噪声', taskType: 'O3_零点噪声', detect: '≤1ppb' },
            { name: '最低检出限', taskType: 'O3_最低检出限', detect: '≤2ppb' },
            { name: '量程噪声', taskType: 'O3_量程噪声', detect: '≤5ppb' },
            { name: '示值误差', taskType: 'O3_示值误差', detect: '±4%F.S' },
            { name: '20%量程精密度', taskType: 'O3_量程精密度', detect: '≤5ppb' },
            { name: '80%量程精密度', taskType: 'O3_量程精密度', detect: '≤10ppb' },
            { name: '24h零点漂移', taskType: 'O3_24h零点漂移', detect: '±5ppb' },
            { name: '24h20%量程漂移', taskType: 'O3_24h量程漂移', detect: '±5ppb' },
            { name: '24h80%量程漂移', taskType: 'O3_24h量程漂移', detect: '±10ppb' },
            { name: '响应时间', taskType: 'O3_响应时间', detect: '≤5min' },
            { name: '电压稳定性', taskType: 'O3_电压稳定性', detect: '±1%F.S' },
            { name: '流量稳定性', taskType: 'O3_流量稳定性', detect: '±10%' },
            { name: '环境温度变化的影响', taskType: 'O3_环境温度变化的影响', detect: '≤1ppb/℃' },
            { name: '转换效率', taskType: 'O3_转换效率', detect: '/' }
        ]
    },
    {
        pollutantCode: 'CO',
        tasks: [{ name: '零点噪声', taskType: 'CO_零点噪声', detect: '≤0.25ppm' },
            { name: '最低检出限', taskType: 'CO_最低检出限', detect: '≤0.5ppm' },
            { name: '量程噪声', taskType: 'CO_量程噪声', detect: '≤1ppm' },
            { name: '示值误差', taskType: 'CO_示值误差', detect: '±2%F.S' },
            { name: '20%量程精密度', taskType: 'CO_量程精密度', detect: '≤0.5ppm' },
            { name: '80%量程精密度', taskType: 'CO_量程精密度', detect: '≤0.5ppm' },
            { name: '24h零点漂移', taskType: 'CO_24h零点漂移', detect: '±1ppm' },
            { name: '24h20%量程漂移', taskType: 'CO_24h量程漂移', detect: '±1ppm' },
            { name: '24h80%量程漂移', taskType: 'CO_24h量程漂移', detect: '±1ppm' },
            { name: '响应时间', taskType: 'CO_响应时间', detect: '≤4min' },
            { name: '电压稳定性', taskType: 'CO_电压稳定性', detect: '±1%F.S' },
            { name: '流量稳定性', taskType: 'CO_流量稳定性', detect: '±10%' },
            { name: '环境温度变化的影响', taskType: 'CO_环境温度变化的影响', detect: '≤0.3ppm/℃' },
            { name: '转换效率', taskType: 'CO_转换效率', detect: '/' }
        ]
    }
]