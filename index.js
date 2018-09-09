var CommonTools = {
  ready: function (fn) {
    if (document.addEventListener) {  //标准浏览器
      document.addEventListener('DOMContentLoaded', function () {
        //注销事件，避免反复触发
        document.removeEventListener('DOMContentLoaded', arguments.callee, false);
        fn();
      }, false)
    }
    else if (document.attachEvent) {    //IE，两个条件
      document.attachEvent('onreadystatechange', function () {
        if (document.readyState == 'complete') {
          //注销事件，避免反复触发
          document.detachEvent('onreadystatechange', arguments.callee);
          fn();
        }
      });
    }
  },
  setFrame: function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
        window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
    }
  }
}
var GM = {//shortfor GameModel
  init: function () {
    CommonTools.setFrame();//frame兼容性
  },
  run: function () {
    GM.init();//保证requestanimation的兼容性
    GM.game();//游戏主函数
  },
  game:function(){
    var stage = document.getElementById('gamebox');
    var context = stage.getContext('2d');

    var camera = {
      w: 800,
      h: 600,
    }

    var score = 0;
    var oScore = document.getElementById('score');

    var ENV={//环境参数
      groundHeight:360,//游戏环境的地面层
      centerX: camera.w/2,
      girdW: camera.w / 4,
    }
    //对象层
    var mc = {
      w: 50,
      h: 120,//实时高度
      oH:120,//原始高度
      minH:20,//最小高度
      speed: 10,
      x: ENV.centerX - 25,
      y: ENV.groundHeight,
      color: 'red',//mc背景      
      speedX: 3,
      speedY: 0,
      minSpeedY:10,//最低速度
      status: 0,//0：静止不懂 1:蓄力 2:飞翔状态
      gravity: 1,
      acce:0.5//速度比值
    }
    var platArr = {
      con: {
        h: 20,
        y: 480
      },
      item: [
        {
          w: 100,
          x: ENV.girdW - 50,
        },
        {
          w: 100,
          x: ENV.girdW * 2 - 50,
        },
        {
          w: 100,
          x: ENV.girdW * 3 - 50,
        },
        {
          w: 100,
          x: ENV.girdW * 4 - 50,
        },
        {
          w: 100,
          x: ENV.girdW * 5 - 50,
        },
      ]
    }

    //事件输入层
    stage.onmousedown = function () {
      mc.status = 1;
    }
    stage.onmouseup = function () {
      mc.status = 2;
      mcstartJump();
    }
    //逻辑层
    function mcstartJump(){
      mc.speedY = (mc.oH - mc.h) * mc.acce;
      if (mc.speedY < mc.minSpeedY) {
        mc.speedY = mc.minSpeedY;
      }
      mc.h = mc.oH;
      mc.y = ENV.groundHeight;
    }
    function cast(){
      if (mc.h>mc.minH) {
        mc.h--;
        mc.y++;
      }
    }
    function gameOver() {
      document.getElementById('result').innerHTML = score;
      document.getElementById('gameover').style.display = 'block';
    }
    function goLogic() {
      switch (mc.status) {
        case 1: cast(); break;
        case 2: jump(); break;
      }
    }
    function jump(){
      var nextFrameY = mc.y - mc.speedY;
      var isOnBoard = false;
      if (nextFrameY > ENV.groundHeight) {//下一帧低于地面了
        checkOnboard();
        if (!isOnBoard) {
          mcFly();
        }
        else{
          mc.status=0;
          score++;
          oScore.innerHTML=score;
        }
      }
      else{
        mcFly();
        mcMoveForward();
      }

      function mcFly(){
        if (mc.y<=600) {
          mc.speedY -= mc.gravity;
          mc.y -= mc.speedY;          
        }
        else{
          gameOver();
        }
      }
      function mcMoveForward(){
        for (var i = 0; i < platArr.item.length; i++) {
          if (platArr.item[i].x > -100) {
            platArr.item[i].x -= mc.speedX;
          }
          else {
            //重置item
            platArr.item[i].x = ENV.girdW * 5;
            platArr.item[i].w = 50 + parseInt(50 * Math.random());
          }
        }        
      }
      function checkOnboard(){
        for (var i = 0; i < platArr.item.length; i++) {
          if (collision(mc, platArr.item[i])) {
            isOnBoard = true;
            return true;
          }
        }
        return false;
      }
    }
    //绘制逻辑    
    function drawMc() {
      context.fillStyle = mc.color;
      context.fillRect(mc.x, mc.y, mc.w, mc.h);
    }
    function drawPlat() {
      context.fillStyle = '#000';
      for (var i = 0; i < platArr.item.length; i++) {
        context.fillRect(platArr.item[i].x, platArr.con.y, platArr.item[i].w, platArr.con.h);
      }
    }
    //碰撞函数
    function collision(obj1, obj2) {
      var obj1L = obj1.x;
      var obj1R = obj1.x + obj1.w;
      var obj2L = obj2.x;
      var obj2R = obj2.x + obj2.w;
      if (obj1R < obj2L || obj1L > obj2R) {
        return false;
      }
      else {
        return true;
      }
    }

    //帧动画
    gameloop();
    function gameloop() {
      context.clearRect(0, 0, camera.w, camera.h);
      goLogic();
      drawMc();
      drawPlat();
      requestAnimationFrame(gameloop);
    }    
  }
}
CommonTools.ready(GM.run);