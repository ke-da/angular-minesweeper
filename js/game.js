angular.module("game",[])
	.controller("boardCtrl", [
		"$scope", "boardGrid",
		function($scope, boardGrid){
			$scope.board = boardGrid;

			$scope.board.on("mineClicked", function(){
				alert("Game over");
				$scope.endGame();
			}).on("win", function(){
				alert("Congratulation, you win!");
				$scope.endGame();
			}).on("error", function(msg){
				alert(msg);
			});

			//Default setting
			$scope.setting = {
				mineNum: 10,
				size: false,
				dimension: "[10,10]"
			};

			var setting = $scope.setting;

			$scope.startGame= function(){
				$scope.ended = false;
				boardGrid.init(setting)
			}

			$scope.endGame = function(){
				$scope.ended = true;
				boardGrid.openAll();
			}

			$scope.$watch("setting.dimension", function(newVal){
				if (!newVal) return;
				var dimension = $scope.$eval(newVal);
				setting.size = Array.isArray(dimension)? {x: dimension[0], y: dimension[1]} : false;
				$scope.startGame();
			});
		}
	])
	.service("boardGrid", [
		function(){
			this.events = {};

			//Coordnate Implementation
			function Coord(x, y){
				this.x = x;
				this.y = y;
			}

			Coord.prototype.setMine = function(){
				this.mine = true;
			}

			Coord.prototype.openWithCnt = function(cnt){
				this.cnt = cnt;
				this.opened = true;
			}

			Coord.prototype.open = function(){
				this.opened = true;
			}

			Coord.prototype.flag = function(){
				this.flagged = true;
			}


			//End coord


			this.param = {};
			
			this.init = function(param){
				param = param || {};
				this.param = param;
				this.setupGrid();
			};

			this.on = function(e, cb){
				this.events[e] = cb;
				return this;
			}

			this.trigger = function(e, params){
				this.events[e](params);
			}

			this.setupGrid = function(){
				var size = this.param.size,
					mineNum = this.param.mineNum;

				if (mineNum >= (size.x * size.y)){
					return this.trigger("error", "Too many mines");
				}

				this.mines = [];
				this.grid = new Array(size.y);
				for(var y=0; y<size.y; y++){
					this.grid[y] = new Array(size.x);
					for(var x=0; x<size.x; x++){
						this.grid[y][x] = new Coord(x,y);
					}
				}

				var mineItem, ranPos, ranX, ranY, currX, currY,
					totalCell = size.x * size.y;
				for(var i=0; i < mineNum; i++){
					//Pick random x,y from unreserved area
					ranPos = this._getRandomInt(i, totalCell);
					ranY = parseInt(ranPos/size.x);
					ranX = parseInt(ranPos%size.x);
					mineItem = this.grid[ranY][ranX];
					if (mineItem.mine){
						currY = parseInt(i/size.x);
						currX = parseInt(i%size.x);
						mineItem = this.grid[currY][currX];
					}
					mineItem.setMine();
					this.mines.push(mineItem);
				}
			}

			// Returns a random integer between min (included) and max (excluded)
			this._getRandomInt = function(min, max){
				return Math.floor(Math.random() * (max - min)) + min;
			}

			this.openAll = function(){
				size = this.param.size;
				for(var y=0; y<size.y; y++){
					for(var x=0; x<size.x; x++){
						if (!this.grid[y][x].opened) this.grid[y][x].open();
					}
				}	
			}

			this.openCoord = function(coord){
				if (coord.mine){
					return this.trigger("mineClicked");
				}
				var adjCnt;
				if (adjCnt = this.numAdjacentMines(coord)){
					coord.openWithCnt(adjCnt);
					return;
				}
				this.openAdjacents(coord);
				coord.open();
			}

			this.flagCoord = function(coord){
				coord.flag();
			}

			this.checkMineFlags = function(){
				var mine;
				for (var i =0; i < this.mines.length; i++){
					mine = this.mines[i];
					if (!mine.flagged) return;
				}
				this.trigger("win");
			}

			this.openAdjacents = function(coord){
				var adjMineCnts
				, adjOpenables = this.getAdjacentCoords(coord).filter(function(item){
					return !item.opened && !item.mine;
				});
				for(var i=0; i < adjOpenables.length; i++){
					var item = adjOpenables[i];
					if ((adjMineCnts = this.numAdjacentMines(item)) > 0){
						item.openWithCnt(adjMineCnts);
					} else{
						item.open();
						this.openAdjacents(item);
					}
				}
			}

			this.getAdjacentCoords = function(coord){
				var coords = [], adj;
				if ( (adj = this.getCoord(coord.x+1, coord.y))) coords.push(adj);
				if ( (adj = this.getCoord(coord.x-1, coord.y))) coords.push(adj);
				if ( (adj = this.getCoord(coord.x, coord.y-1))) coords.push(adj);
				if ( (adj = this.getCoord(coord.x, coord.y+1))) coords.push(adj);
				if ( (adj = this.getCoord(coord.x+1, coord.y+1))) coords.push(adj);
				if ( (adj = this.getCoord(coord.x+1, coord.y-1))) coords.push(adj);
				if ( (adj = this.getCoord(coord.x-1, coord.y+1))) coords.push(adj);
				if ( (adj = this.getCoord(coord.x-1, coord.y-1))) coords.push(adj);
				return coords;
			}

			this.numAdjacentMines = function(coord){
				var adjacentMines = this.getAdjacentCoords(coord).filter(function(item){
					return item.mine;
				});
				return adjacentMines.length;
			}

			this.getCoord = function(x,y) {
				if (x >= 0 && y >= 0 && x < this.param.size.x && y < this.param.size.y){
					return this.grid[y][x];
				}
			}
		}
	])
	.directive('ngRightClick', [
		"$parse",
		function($parse){
			return function(scope, element, attrs) {
				var fn = $parse(attrs.ngRightClick);
				element.bind('contextmenu', function(event) {
					scope.$apply(function() {
						event.preventDefault();
						fn(scope, {$event:event});
					});
				});
			};
		}
	])
