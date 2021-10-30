App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Asset.json", function(asset) {
      App.contracts.Asset = TruffleContract(asset);
      App.contracts.Asset.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Asset.deployed().then(function(instance) {
      instance.boughtEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        App.render();
      });
    });
  },

  render: function() {
    var assetInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Asset.deployed().then(function(instance) {
      assetInstance = instance;
      return assetInstance.propertyCount();
    }).then(function(propertyCount) {
      var propResults = $("#propertyResults");
      propResults.empty();

      var propSelect = $('#propertySelect');
      propSelect.empty();

      for (var i = 1; i <= propertyCount; i++) {
        assetInstance.Properties(i).then(function(property) {
          var id = property[0];
          var name = property[1];
          var price = property[2];
          var owner = property[3];

          // Load property Result
          var propTemp = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + price + "</td><td>" + owner + "</td></tr>"
          propResults.append(propTemp);

          // Load property options
          var propOp = "<option value='" + id + "' >" + name + "</ option>"
          propSelect.append(propOp);
        });
        loader.hide();
        content.show();
      }
    }).catch(function(error) {
      console.warn(error);
    });
  },

  buyProperty: function() {
    var propertyId = $('#propertySelect').val();
    //load accunt data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        //get balance in account
        web3.eth.getBalance(account, function(err, result) {
          if (err === null) {
            var balance = web3.fromWei(result, "ether")
            App.contracts.Asset.deployed().then(function(instance) {
              assetInstance = instance
              assetInstance.Properties(propertyId).then(function(property){
              var price = property[2];
              var owner = property[3];
              if (balance.toNumber() >= price.toNumber()){
                // start transaction
                web3.eth.sendTransaction({
                  from: account,
                  to: owner, 
                  value: web3.toWei(price, "ether"), 
              }, function(err, transactionHash) {
                  if (err) { 
                      return(err); 
                  } else {
                    App.contracts.Asset.deployed().then(function(instance) {
                      return instance.buy(propertyId, { from: App.account });
                    }).then(function(result) {
                      $("#content").hide();
                      $("#loader").show();
                    }).catch(function(err) {
                      console.error(err);
                    });
                      console.log(transactionHash);
                  }
              });
              }
              else{
                $("#accountAddress").html("Not enough balance in : " + account);
              }
            });
              })

            }})
          }
        });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

