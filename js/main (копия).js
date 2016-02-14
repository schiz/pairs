var Game = new ( Backbone.View.extend({
	
	Models: {},
	Views: {},
	Instances: {},   //сделать при рефакторинге

	events: {
		'click a' : 'resetDefault'
		
	},
	resetDefault: function(e){	
		e.preventDefault();
	},
	initialize: function(){		
		this.setElement('body');
		if (navigator.appVersion.indexOf("Win")!=-1) $('html').addClass("win");
		if(!Modernizr.csstransforms3d) $('html').addClass('no-animation')
	},	
	start: function(){
		Game.startScreen = new Game.Views.Startscreen;
		Game.gameField = new Game.Views.Field;
	}	
}))()

/* startScreen */
Game.Views.Startscreen = Backbone.View.extend({
	events: {
		'click .start-btn'   :  'startGame',
		'click .rules-btn'   :  'showRules',
		'click .ranking-btn' :  'showRating'
	},
	initialize: function(){
		this.setElement('.start-screen');		
	},
	startGame: function(){		
		this.$el.fadeOut('200',function(){			
			Game.gameField.$el.fadeIn('200');	  // сделать return this.$el		
			Game.gameField.startTimer();
		})
		
	},
	showRules: function(){
		var rules;
		this.$el.fadeOut('100',function(){
			rules = new Game.Views.Rules;
			rules.$el.fadeIn('200');			
		})

	},
	showRating: function(e){
		var url = $(e.currentTarget).attr('href');
		document.location.href = url;
	},
	render: function(){}
});

/* rules */

Game.Views.Rules = Backbone.View.extend({
	events: {},
	initialize: function(){
		this.setElement('.rules-screen');		
		this.render();
	},
	render: function(){	
		var self = this;

    	this.$el.modal({
	    	onClose: function(rules){
	    		$(rules).fadeOut(200,function(){
		    		$.modal.close();
		    		$('.start-screen').fadeIn(200); //here 
	    		})	    		
	    	},
	    	onShow: function(rules) {
	    		$(rules).fadeIn(200,function(){	    			
	    			self.$el.find('.rules-text').jScrollPane({	    				
	    				autoReinitialise: true,
	    			});	    			
	    		});
	    	}
    	});
	}
})


/* gameField */

Game.Models.Field = Backbone.Model.extend({
	defaults: {		
		'types': ['panda','koala','kengoroo','deer','eagle','fish','owl','zebra','frog',
				  'squirrel','lion','opossum','fox','penguin','flamingo','ostrich','lizard','tiger'
				 ]
	}
})

Game.Views.Field = Backbone.View.extend({
	events: {
		'click .card' : 'handleCard',
		'click .reload' : 'startGame'
	},

	previousCard: false,
	timer: false,

	userResult: {
		seconds: 0,
		clicks: 0
	},	

	handleCard: function(e){
		
		if ($(e.currentTarget).hasClass('openedCard') || $(e.currentTarget).hasClass('hiddenCard') ) return;			

			if (this.$el.find('.openedCard').length > 1 ) return;   //refactor

  
		
		var currentCard = $(e.currentTarget),
			currentType = currentCard.data('type'),
			self = this;

			currentCard.removeClass('closedCard').addClass('openedCard'); //here
			this.$el.find('.clicksCount #clicks').html(this.userResult.clicks += 1);

			
		
			if (this.previousCard) {
				if (currentType === this.previousCard) {
					//self.$el.find('.card').addClass('hiddenCard');  нужно для проверки

					setTimeout(function(){
						self.$el.find('.openedCard').addClass('hiddenCard').on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd',
							function(){
								$(this).removeClass('openedCard');
							}
						);
						self.previousCard = false;
						
						if (self.openedAllCards()) { 							
							self.showResultPage(self.userResult);
						}

					},600);					
				} 
				else {
					setTimeout(function(){
						self.$el.find('.openedCard').addClass('closedCard').removeClass('openedCard');											
						self.previousCard = false;	
					},1000);	
				}				  
			}
			else {								
				this.previousCard = currentType;
			}
	},
	openedAllCards: function(){
		var result;

		this.$el.find('.hiddenCard').length === this.$el.find('.card').length ? result = true : result = false;				
		return result;
	},
	showResultPage: function(userResult){
		var result;
		this.$el.fadeOut('100',function(){			
			result = new Game.Views.Result(userResult);
			result.$el.fadeIn('200');
		})
	},
	initialize: function(){		
		this.setElement('.game-screen');		
		this.model = new Game.Models.Field;		
		this.startGame();		
	},	
	startGame: function(){
		var self = this;
		
		if (this.userResult.clicks > 0) this.clearClicks();

		if (this.$el.find('.card').length > 0) {
			self.$el.fadeOut(200,function(){
				self.addCards();
				if (self.timer) self.startTimer();
				self.$el.fadeIn(200);				
			})
		} else {					
			this.addCards();
			if (self.timer) self.startTimer();
		}

		
	},
	addCards: function(){
		var types = this.model.get('types'),
			types = types.concat(types),
			types = this.shuffle(types),
			typesLength = types.length,
			cardField = this.$el.find('.cards-field');

		cardField.hide().html('');
		for (var i = typesLength; i--;) {
			cardField.append(  //backlogo need cache
				$('<div class="card" data-type='+types[i]+'><img class="front" src="images/types/backlogo.png"/><img class="back" src="images/types/'+types[i]+'.png"/></div>') 
			)
		}
		cardField.show()	
			
	},
	clearClicks: function(){		
		this.$el.find('.clicksCount #clicks').html(this.userResult.clicks = 0);

	},
	shuffle: function(o){		
	    for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	    return o;
	},
	startTimer: function(){
		if (this.timer) {
			clearInterval(this.timer);
			this.userResult.seconds = 0;
			this.$el.find('.timer').html('0:00');
		} 

		var self = this;

		this.timer = setInterval(function(){
			self.$el.find('.timer').html(self.formatTime(self.userResult.seconds += 1));
				
		},1000);
	},
	formatTime: function(seconds){
		var d = Number(seconds),
			h = Math.floor(d / 3600),
			m = Math.floor(d % 3600 / 60),
			s = Math.floor(d % 3600 % 60);

		return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s); 
	},
	render: function(){
		return this; //return this.$el
	}
});

Game.Views.Result = Backbone.View.extend({
	events: {
		'click #playAgain' : 'restartGame',
		'click .saveBtn' : 'save',		
	},

	started: false,
	encryptKey: false,

	initialize: function(userResult){
		this.setElement('.result-screen');
		this.getKey();
		this.userResult = userResult;
		this.on('saved failed',this.showResult);		
		this.render();
	},
	getKey: function(){
		var self = this;
		$.get('ajax/gamestore.php',{action:'getkey'}, 	function(data) {		
			console.log(data);		//для дебага
			response = JSON.parse(data);			
  			response.res === 1 ? self.encryptKey = response.data : console.log('error. Key not recieved');  //сделал console.log как обработчик ошибки. Можно менять на что угодно
		 });
	},
	restartGame: function(e){
		if (this.started) return;
		
		Game.gameField.startGame();
		this.started = true;		
	},
	save: function(){
		var stringToEncrypt = 'clicks: ' + this.userResult.clicks + ',seconds: ' + this.userResult.seconds + '#',
			codedData = new Blowfish(this.encryptKey).encrypt(stringToEncrypt),
			self = this,
			response;

		$.post('ajax/gamestore.php', 
			{ 
				have_code: "1", //для совместимости с gamestore.php
				action: 'store',
				data: codedData
			}, 
			function(data) {		
				console.log(data)	//для дебага
				response = JSON.parse(data);			
				if (response.res === 0 && response.data.length > 0 ) {
					document.location.href = response.data;
				} else if (response.res === 1) {
					 self.trigger('saved',{saved: true});    //при рефак. убрать лишнее с saveResult
				} 	  			
		    }
		);
	},
	showResult: function(e){
		var page;		
		this.$el.fadeOut('100',function(){			
			page = new Game.Views.SaveResult(e);
			page.$el.fadeIn('200');
		})
	},	
	render: function(){	
		this.$el.find('.seconds span').html(this.userResult.seconds);
		this.$el.find('.clicks span').html(this.userResult.clicks);    	
	}
})
Game.Views.SaveResult = Backbone.View.extend({
	events: {
		'click .backToGame' : 'backToGame'
	},
	initialize: function(e){
		this.setElement('.save-result')
		this.isSaved = e.saved;
		this.render();		
	},
	backToGame: function(){			
		this.$el.fadeOut('100',function(){			
			$.modal.close();			
			Game.startScreen.$el.fadeIn('100');

		})
	},
	render: function(){
		if (this.isSaved) {
			this.$el.modal({closeClass:'saveCloseImg'});
		}
	}
})



jQuery(document).ready(function($) {
	Game.start();
});
