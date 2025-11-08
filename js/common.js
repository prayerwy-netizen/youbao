/*
 * 宥宝礼物兑换系统 - 公共脚本
 * 包含：数据管理、工具函数、通用逻辑
 */

// ========== 数据管理类 ==========
class DataManager {
  constructor() {
    this.initializeData();
  }

  // 获取默认任务模板
  getDefaultTasks() {
    return [
      { id: 1, name: '算数', unit: '10题/次', score: 3, type: 'positive', enabled: true },
      { id: 2, name: '英语绘本', unit: '1本/次', score: 5, type: 'positive', enabled: true },
      { id: 3, name: '跳绳', unit: '10个/次', score: 1, type: 'positive', enabled: true },
      { id: 4, name: '认真上课外班', unit: '1次', score: 2, type: 'positive', enabled: true },
      { id: 5, name: '背古诗', unit: '1首/次', score: 3, type: 'positive', enabled: true },
      { id: 6, name: '认真写字', unit: '1次', score: 2, type: 'positive', enabled: true },
      { id: 7, name: '英语打卡', unit: '1次', score: 2, type: 'positive', enabled: true },
      { id: 8, name: '晚9:30前上床', unit: '1次', score: 2, type: 'positive', enabled: true },
      { id: 9, name: '早7:50前入园', unit: '1次', score: 2, type: 'positive', enabled: true },
      { id: 10, name: '主动扫干净地', unit: '1次', score: 2, type: 'positive', enabled: true },
      { id: 11, name: '在校得到贴纸', unit: '1张/次', score: 3, type: 'positive', enabled: true },
      { id: 12, name: '练习尤克里里', unit: '15分钟/次', score: 3, type: 'positive', enabled: true },
      { id: 13, name: '自己收拾书包', unit: '1次', score: 1, type: 'positive', enabled: true },
      { id: 14, name: '周末收拾屋子', unit: '1次', score: 10, type: 'positive', enabled: true },
      { id: 15, name: '养成穿脱鞋习惯', unit: '1次', score: 10, type: 'positive', enabled: true },
      { id: 16, name: '一周不随意买东西', unit: '1周', score: 10, type: 'positive', enabled: true },
      { id: 17, name: '读中文绘本', unit: '1个故事/次', score: 1, type: 'positive', enabled: true },
      { id: 18, name: '用脏话骂人', unit: '1次', score: -2, type: 'negative', enabled: true }
    ];
  }

  // 初始化数据
  initializeData() {
    if (!localStorage.getItem('dingdang_initialized')) {
      this.resetToDefaults();
    }

    // 检查任务是否为空,如果为空则恢复默认任务
    const tasks = this.getTasks();
    if (tasks.length === 0) {
      const defaultTasks = this.getDefaultTasks();
      localStorage.setItem('dingdang_tasks', JSON.stringify(defaultTasks));
    }
  }

  // 重置为默认状态
  resetToDefaults() {
    const defaultTasks = this.getDefaultTasks();
    localStorage.setItem('dingdang_tasks', JSON.stringify(defaultTasks));
    localStorage.setItem('dingdang_records', JSON.stringify([]));
    localStorage.setItem('dingdang_gifts', JSON.stringify([]));
    localStorage.setItem('dingdang_requests', JSON.stringify([]));
    localStorage.setItem('dingdang_pin', '1234'); // 默认PIN码
    localStorage.setItem('dingdang_initialized', 'true');
  }

  // 恢复默认任务（单独方法,可以在设置页面调用）
  restoreDefaultTasks() {
    const defaultTasks = this.getDefaultTasks();
    localStorage.setItem('dingdang_tasks', JSON.stringify(defaultTasks));
    return defaultTasks;
  }

  // 获取所有任务
  getTasks() {
    return JSON.parse(localStorage.getItem('dingdang_tasks') || '[]');
  }

  // 保存任务
  saveTasks(tasks) {
    localStorage.setItem('dingdang_tasks', JSON.stringify(tasks));
  }

  // 添加任务
  addTask(task) {
    const tasks = this.getTasks();
    task.id = Date.now();
    tasks.push(task);
    this.saveTasks(tasks);

    // 同步到云端
    if (window.supabaseSync) {
      window.supabaseSync.addTask(task).then(cloudTask => {
        if (cloudTask && cloudTask.id !== task.id) {
          // 更新本地ID为云端ID
          task.id = cloudTask.id;
          this.saveTasks(this.getTasks().map(t => t.id === Date.now() ? task : t));
        }
      });
    }

    return task;
  }

  // 更新任务
  updateTask(taskId, updates) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.saveTasks(tasks);

      // 同步到云端
      if (window.supabaseSync) {
        window.supabaseSync.updateTask(tasks[index]);
      }

      return tasks[index];
    }
    return null;
  }

  // 删除任务
  deleteTask(taskId) {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    this.saveTasks(filtered);

    // 同步到云端
    if (window.supabaseSync) {
      window.supabaseSync.deleteTask(taskId);
    }
  }

  // 获取所有记录
  getRecords() {
    return JSON.parse(localStorage.getItem('dingdang_records') || '[]');
  }

  // 添加记录
  addRecord(record) {
    const records = this.getRecords();
    record.id = Date.now();
    record.date = record.date || new Date().toISOString();
    records.unshift(record); // 添加到开头
    localStorage.setItem('dingdang_records', JSON.stringify(records));

    // 同步到云端
    if (window.supabaseSync) {
      window.supabaseSync.addRecord(record).then(cloudRecord => {
        if (cloudRecord && cloudRecord.id !== record.id) {
          // 更新本地ID为云端ID
          record.id = cloudRecord.id;
          const allRecords = this.getRecords();
          const index = allRecords.findIndex(r => r.date === record.date && r.score === record.score);
          if (index !== -1) {
            allRecords[index].id = cloudRecord.id;
            localStorage.setItem('dingdang_records', JSON.stringify(allRecords));
          }
        }
      });
    }

    return record;
  }

  // 删除记录（异步方法，等待云端删除完成）
  async deleteRecord(recordId) {
    console.log(`📝 删除记录 - 本地ID: ${recordId}`);

    const records = this.getRecords();
    const filtered = records.filter(r => r.id !== recordId);
    localStorage.setItem('dingdang_records', JSON.stringify(filtered));
    console.log('✅ 本地记录已删除');

    // 同步到云端并等待完成
    if (window.supabaseSync && window.supabaseSync.enabled) {
      try {
        await window.supabaseSync.deleteRecord(recordId);
        console.log('✅ 云端删除操作已完成');
      } catch (error) {
        console.error('❌ 云端删除失败:', error);
        // 即使云端删除失败，本地已删除，不影响用户体验
        // 但需要提示用户
        throw error;
      }
    } else {
      console.log('📱 仅删除本地数据（云同步未启用）');
    }
  }

  // 获取指定日期的记录
  getRecordsByDate(date) {
    const records = this.getRecords();
    const targetDate = new Date(date).toDateString();
    return records.filter(r => new Date(r.date).toDateString() === targetDate);
  }

  // 计算总积分
  getTotalScore() {
    const records = this.getRecords();
    return records.reduce((sum, record) => sum + record.score, 0);
  }

  // 获取每日积分汇总
  getDailyScores(month, year) {
    const records = this.getRecords();
    const dailyScores = {};

    records.forEach(record => {
      const date = new Date(record.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const day = date.getDate();
        if (!dailyScores[day]) {
          dailyScores[day] = { positive: 0, negative: 0 };
        }
        if (record.score > 0) {
          dailyScores[day].positive += record.score;
        } else {
          dailyScores[day].negative += record.score;
        }
      }
    });

    return dailyScores;
  }

  // 获取所有礼物
  getGifts() {
    return JSON.parse(localStorage.getItem('dingdang_gifts') || '[]');
  }

  // 保存礼物
  saveGifts(gifts) {
    localStorage.setItem('dingdang_gifts', JSON.stringify(gifts));
  }

  // 添加礼物
  addGift(gift) {
    const gifts = this.getGifts();
    gift.id = Date.now();
    gift.enabled = true;
    gifts.push(gift);
    this.saveGifts(gifts);

    // 同步到云端
    if (window.supabaseSync) {
      window.supabaseSync.addGift(gift).then(cloudGift => {
        if (cloudGift && cloudGift.id !== gift.id) {
          // 更新本地ID为云端ID
          gift.id = cloudGift.id;
          this.saveGifts(this.getGifts().map(g => g.name === gift.name && g.score === gift.score ? gift : g));
        }
      });
    }

    return gift;
  }

  // 更新礼物
  updateGift(giftId, updates) {
    const gifts = this.getGifts();
    const index = gifts.findIndex(g => g.id === giftId);
    if (index !== -1) {
      gifts[index] = { ...gifts[index], ...updates };
      this.saveGifts(gifts);

      // 同步到云端
      if (window.supabaseSync) {
        window.supabaseSync.updateGift(gifts[index]);
      }

      return gifts[index];
    }
    return null;
  }

  // 删除礼物
  deleteGift(giftId) {
    const gifts = this.getGifts();
    const filtered = gifts.filter(g => g.id !== giftId);
    this.saveGifts(filtered);

    // 同步到云端
    if (window.supabaseSync) {
      window.supabaseSync.deleteGift(giftId);
    }
  }

  // 获取所有兑换申请
  getRequests() {
    return JSON.parse(localStorage.getItem('dingdang_requests') || '[]');
  }

  // 保存兑换申请
  saveRequests(requests) {
    localStorage.setItem('dingdang_requests', JSON.stringify(requests));
  }

  // 添加兑换申请
  addRequest(request) {
    const requests = this.getRequests();
    request.id = Date.now();
    request.date = new Date().toISOString();
    request.status = 'pending';
    requests.unshift(request);
    this.saveRequests(requests);

    // 同步到云端
    if (window.supabaseSync) {
      window.supabaseSync.addRequest(request).then(cloudRequest => {
        if (cloudRequest && cloudRequest.id !== request.id) {
          // 更新本地ID为云端ID
          request.id = cloudRequest.id;
          const allRequests = this.getRequests();
          if (allRequests.length > 0 && allRequests[0].date === request.date) {
            allRequests[0].id = cloudRequest.id;
            this.saveRequests(allRequests);
          }
        }
      });
    }

    return request;
  }

  // 更新申请状态
  updateRequestStatus(requestId, status) {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      requests[index].status = status;
      requests[index].processedDate = new Date().toISOString();
      this.saveRequests(requests);

      // 同步到云端
      if (window.supabaseSync) {
        window.supabaseSync.updateRequest(requests[index]);
      }

      return requests[index];
    }
    return null;
  }

  // updateRequest 别名方法（兼容性）
  updateRequest(requestId, status) {
    return this.updateRequestStatus(requestId, status);
  }

  // 验证PIN码
  verifyPin(pin) {
    const savedPin = localStorage.getItem('dingdang_pin') || '1234';
    return pin === savedPin;
  }

  // 修改PIN码
  changePin(newPin) {
    localStorage.setItem('dingdang_pin', newPin);

    // 同步到云端
    if (window.supabaseSync) {
      window.supabaseSync.updateSetting('parent_pin', newPin);
    }
  }

  // 导出数据
  exportData() {
    return {
      tasks: this.getTasks(),
      records: this.getRecords(),
      gifts: this.getGifts(),
      requests: this.getRequests(),
      exportDate: new Date().toISOString()
    };
  }

  // 导入数据
  importData(data) {
    if (data.tasks) localStorage.setItem('dingdang_tasks', JSON.stringify(data.tasks));
    if (data.records) localStorage.setItem('dingdang_records', JSON.stringify(data.records));
    if (data.gifts) localStorage.setItem('dingdang_gifts', JSON.stringify(data.gifts));
    if (data.requests) localStorage.setItem('dingdang_requests', JSON.stringify(data.requests));
  }

  // 初始化积分
  initializeScore(score) {
    const record = {
      id: Date.now(),
      taskId: 0,
      taskName: '积分初始化',
      score: parseInt(score),
      note: '从纸质表格导入的初始积分',
      date: new Date().toISOString()
    };
    this.addRecord(record);
    return record;
  }
}

// ========== 工具函数 ==========
const utils = {
  // 格式化日期
  formatDate(date) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}月${day}日`;
  },

  // 格式化日期时间
  formatDateTime(date) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  // 显示Toast提示
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
        ${type === 'success'
          ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
          : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
        }
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, type === 'success' ? 2000 : 3000);
  },

  // 显示确认对话框
  showConfirm(title, content, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="modal-title">${title}</h3>
        <div class="modal-content">${content}</div>
        <div class="modal-actions">
          <button class="btn-secondary modal-cancel">取消</button>
          <button class="btn-primary modal-confirm">确定</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add('show'), 10);

    overlay.querySelector('.modal-cancel').onclick = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      if (onCancel) onCancel();
    };

    overlay.querySelector('.modal-confirm').onclick = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      if (onConfirm) onConfirm();
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 200);
        if (onCancel) onCancel();
      }
    };
  },

  // 显示礼花动画
  showConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FFD700', '#FFB6C1', '#90EE90', '#4A90E2'];

    // 创建粒子
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 3000,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2
      });
    }

    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      if (elapsed > 3000) {
        document.body.removeChild(canvas);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // 重力

        const alpha = 1 - (elapsed / p.life);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }

    animate();

    // 显示祝贺文字
    const message = document.createElement('div');
    message.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px;font-weight:700;color:#FFD700;text-shadow:2px 2px 4px rgba(0,0,0,0.3);z-index:10000;animation:bounce 0.5s ease;pointer-events:none';
    message.textContent = '🎉 兑换成功！🎉';
    document.body.appendChild(message);

    setTimeout(() => message.remove(), 3000);
  },

  // 检查是否是家长模式
  isParentMode() {
    return sessionStorage.getItem('parent_mode') === 'true';
  },

  // 进入家长模式
  enterParentMode() {
    sessionStorage.setItem('parent_mode', 'true');
  },

  // 退出家长模式
  exitParentMode() {
    sessionStorage.removeItem('parent_mode');
    window.location.href = 'index.html';
  },

  // 检查家长模式权限
  requireParentMode() {
    if (!this.isParentMode()) {
      window.location.href = 'parent-login.html';
    }
  }
};

// 创建全局数据管理器实例
const dataManager = new DataManager();

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.2); }
  }
`;
document.head.appendChild(style);
