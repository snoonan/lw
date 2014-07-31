var game = {max_players: 4 };

Array.prototype.shuffle = function() {
    var s = [];
    while (this.length) s.push(this.splice(Math.random() * this.length, 1)[0]);
    while (s.length) this.push(s.pop());
    return this;
}

function removedie(die) {
   die.innerText = 'X';
   die.className = 'die nodie';
}

function torolldie(die) {
   die.innerText = '@';
   die.className = 'die roll';
}

function rolldie(die) {
   var roll= Math.floor((Math.random()*6)+1);
   die.innerText = roll;
   die.className = 'die rolled';
}

function open_level(l) {
   var p;
   var factory = document.getElementById('c'+l+'_co');
   factory.className = 'openable';
   var die = document.getElementById('c'+l+'_dice').firstChild;
   rolldie(die);
   for (p = 0; p < game.max_players; p++) {
      var purchase = document.getElementById('p'+p+'_c'+l+'_buy');
      purchase.hidden = false;
   }
}

function update_cap(c,p) {
   var c;
   var upgraded = 0;
   var up_price = 0;
   var spend = document.getElementById('p'+p+'_spend');
   for (c = 1; c < 15; c++) {
      var diff;
      var ccap = document.getElementById('p'+p+'_c'+c+'_ccap');
      var cap = document.getElementById('p'+p+'_c'+c+'_cap');

      diff = +(cap.value) - +(ccap.innerText);
      up_price += c*diff*2;
      upgraded = Math.max(0,upgraded-diff);
   }
   spend.innerText = '+'+up_price;
   if (upgraded != 0) {
      spend.innerText = '+*'+up_price;
   }
}

function close_level(l) {
   var i;
   for (i = 0; i < game.max_players; i++) {
      var purchase = document.getElementById('p'+i+'_c'+l+'_buy');
      purchase.hidden = true;
   }
}

function buy_factory(c, p) {
   if (game.order[game.player] != p || game.state != 0) {
      return;
   }
   // if !$$
   var cash = document.getElementById('p'+p+'_cash');
   if (+cash.innerText < c*4) {
      return;
   } else {
      cash.innerText = +cash.innerText - c*4;
   }
   var factory = document.getElementById('c'+(c+1)+'_co');
   if (factory.className != 'openable' && factory.className != 'opened') {
      open_level(c+1);
   }
   var factory = document.getElementById('c'+c+'_co');
   factory.className = 'opened';
   factory.innerText = +factory.innerText - 1;
   if (+factory.innerText == 0) {
      close_level(c);
   }
   var purchase = document.getElementById('p'+p+'_c'+c+'_buy');
   purchase.hidden = true;
   var cap = document.getElementById('p'+p+'_c'+c+'_cap');
   cap.hidden = false;
   cap.value = 1;
   var ccap = document.getElementById('p'+p+'_c'+c+'_ccap');
   ccap.hidden = false;
   ccap.innerText='1';
   next();
}

function order_rows() {
   // shuffle player rows to be in play order
   var before = document.getElementById('p_end');
   var board = before.parentNode;
   for (var i = game.max_players-1; i >= 0; i--){
      var pl = document.getElementById('p'+game.order[i]);
      board.insertBefore(pl, before);
      before = pl;
   }
}

function do_maintenance() {
   var c;
   for(c=14; c >0; c--) {
      // sell to cap
      var cdice = document.getElementById('c'+c+'_dice');
      var dice = cdice.getElementsByClassName('rolled');
      dice = [].slice.call( dice );
      var d = [];

      if (dice.length == 0) {
         continue;
      }

      // Sort large to small
      dice.sort(function (a,b) { return +(b.innerText)-+(a.innerText); });
      for(var i=0; i < dice.length; i++) {
         d[i] = +dice[i].innerText;
      }

      var p;
      var caps = []
      var earnings = []
      var totalcap = 0;
      for(p=0; p <game.max_players; p++) {
         var ccap = document.getElementById('p'+p+'_c'+c+'_ccap');
         caps[p] = +ccap.innerText;
         totalcap += caps[p];
         earnings[p] = 0;
      }
      while(dice.length && totalcap)
      {
         var pi;


         for(pi=0; pi <game.max_players; pi++) {
            var p;
            var di;
            p = game.order[pi];


            if (caps[p] == 0) {
               continue;
            }
            if (dice.length  == 0 || totalcap == 0) {
               continue;
            }

            di = d.indexOf(caps[p]);
            if (di != -1) {
               totalcap -= d[di];
               earnings[p] += d[di]*c;
               caps[p] = 0;
               torolldie(dice[di]);
               d.splice(di,1);
               dice.splice(di,1);
               continue;
            }
            if (d[0] > caps[p]) {
               d[0] -= caps[p];
               dice[0].innerText = d[0];
               earnings[p] += caps[p]*c;
               totalcap -= caps[p];
               caps[p] = 0;
               // Sort large to small
               dice.sort(function (a,b) { return +(b.innerText)-+(a.innerText); });
               d.sort(function (a,b) {return b-a});
            } else {
               caps[p] -= d[0];
               earnings[p] += d[0]*c;
               totalcap -= d[0];
               torolldie(dice[0]);
               d.shift();
               dice.shift();
            }
         }
      }
      for(p=0; p <game.max_players; p++) {
         var cash = document.getElementById('p'+p+'_cash');
         cash.innerText = +cash.innerText + earnings[p];
      }
   }
   var color = {'green':0, 'red':0, 'yellow':0, 'blue':0};

   for(c=14; c >0; c--) {
      // move dice
      var factory = document.getElementById('c'+c+'_co');
      if (factory.className != 'opened') {
         continue;
      }
      var cdice = document.getElementById('c'+c+'_dice');
      var roll = cdice.getElementsByClassName('rolled');
      var reroll = cdice.getElementsByClassName('roll');
      var empty = cdice.getElementsByClassName('nodie');

      if (roll.length + reroll.length == 0) {
         continue;
      }
      if (color[cdice.className] == 0) {
         // best of color, +1 die
         color[cdice.className] = c;
         if (empty.length) {
            rolldie(empty[0]);
         }
      } else if (color[cdice.className] > 0) {
         // second of color, -1 die
         color[cdice.className] *= -1; // Negative to mark second seen.
         if (reroll.length) {
            removedie(reroll[0]);
         } else {
            removedie(roll[0]);
         }
      } else {
         // Third of color, move all (that fit) to first.
         var up_cdice = document.getElementById('c'+c+'_dice');
         var up_empty = cdice.getElementsByClassName('nodie');

         for (var i = 0; i < roll.length; i++) {
            removedie(roll[i]);
            if (up_empty.length) {
               rolldie(up_empty[0]);
            }
         }
         for (var i = 0; i < reroll.length; i++) {
            removedie(reroll[i]);
            if (up_empty.length) {
               rolldie(up_empty[0]);
            }
         }
      }
   }
   for(c=14; c >0; c--) {
      // reroll
      var cdice = document.getElementById('c'+c+'_dice');
      var dice = cdice.getElementsByClassName('roll');
      dice = [].slice.call( dice ); // Freeze the list.

      for(var i = 0; i < dice.length; i++) {
         rolldie(dice[i]);
      }
   }
   // tax
   for(p=0; p< game.max_players; p++) {
      var cash = document.getElementById('p'+p+'_cash');
      cash.innerText = Math.ceil(+cash.innerText*0.9);
      if (cash.innerText >=300) {
         alert("Winner");
      }
   }
   // order
   game.order.sort(function (a,b) {
      return +(document.getElementById('p'+a+'_cash').innerText) - +(document.getElementById('p'+b+'_cash').innerText);
   })
   order_rows();
}

function done() {
   var p = game.order[game.player];

   if (game.state == 1) {
      var spend = document.getElementById('p'+p+'_spend');
      if (spend.innerText.charAt(1) != '*') {
         var cash = document.getElementById('p'+p+'_cash');
         var c;

         if (+cash.innerText >= spend.innerText) {
            cash.innerText-= spend.innerText;

            for(c=1; c <15; c++) {
               var cap = document.getElementById('p'+p+'_c'+c+'_cap');
               var ccap = document.getElementById('p'+p+'_c'+c+'_ccap');

               ccap.innerText = cap.value;
               if (cap.value =- 0) {
                  cap.hidden = true;
                  ccap.hidden = true;
               }
            }
         }
      }
      spend.innerText='';
   }
   next();
}

function next() {
   if (game.player >= 0) {
      var done = document.getElementById('p'+game.order[game.player]+'_done');
      done.hidden = true;
   }

   game.player += 1;
   if (game.player == game.max_players)
   {
      game.state += 1;
      if (game.state == 2) {
        do_maintenance();
        game.state = 0;
      }
      game.player = 0;
   }

   var done = document.getElementById('p'+game.order[game.player]+'_done');
   done.hidden = false;
}

function start() {
   game.order = [3,1,0,2];
//   game.order.shuffle()
   open_level(1);

   order_rows();

   game.player=-1;
   game.state = 0;
   next();
}
