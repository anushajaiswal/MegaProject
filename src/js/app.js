var phaseEnum; // for changing phases of voting
App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,

  init: async function () {
    // Load pets.

    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        App.account = accounts[0]; // Save the first account
      } catch (error) {
        if (error.code === 4001) {
          console.error("User denied account access");
        }
      }
    } else if (window.web3) {
      // Legacy dapp browsers...
      App.web3Provider = window.web3.currentProvider;
    } else {
      console.log(
        "No Ethereum browser detected. You should consider trying MetaMask!"
      );
      return;
    }

    // Set web3
    window.web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Contest.json", function (contest) {
      App.contracts.Contest = TruffleContract(contest);

      App.contracts.Contest.setProvider(web3.currentProvider);

      return App.render();
    });
  },

  render: function () {
    var contestInstance;
    var loader = $("#loader");
    var content = $("#content");
    loader.show();
    content.hide();
    $("#after").hide();

    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your account: " + account);
      }
    });
    // ------------- fetching candidates to front end from blockchain code-------------
    App.contracts.Contest.deployed()
      .then(function (instance) {
        contestInstance = instance;
        return contestInstance.contestantsCount();
      })
      .then(function (contestantsCount) {
        // var contestantsResults=$("#contestantsResults");
        // contestantsResults.empty();

        // var contestantSelect=$("#contestantSelect");
        // contestantSelect.empty();

        // for(var i=1; i<=contestantsCount; i++){
        //   contestInstance.contestants(i).then(function(contestant){
        //     var id=contestant[0];
        //     var name=contestant[1];
        //     var voteCount=contestant[2];
        //     var fetchedParty=contestant[3];
        //     var fetchedAge = contestant[4];
        //     var fetchedQualification = contestant[5]

        //     var contestantTemplate="<tr><th>"+id+"</th><td>"+name+"</td><td>"+fetchedAge+"</td><td>"+fetchedParty+"</td><td>"+fetchedQualification+"</td><td>"+voteCount+"</td></tr>";
        //     contestantsResults.append(contestantTemplate)  ;

        //     var contestantOption="<option value='"+id+"'>"+name+"</option>";
        //     contestantSelect.append(contestantOption);

        var contestantsResults = $("#test");
        contestantsResults.empty();
        var contestantsResultsAdmin = $("#contestantsResultsAdmin");
        contestantsResultsAdmin.empty();

        var contestantSelect = $("#contestantSelect");
        contestantSelect.empty();

        for (var i = 1; i <= contestantsCount; i++) {
          contestInstance.contestants(i).then(function (contestant) {
            var id = contestant[0];
            var name = contestant[1];
            var voteCount = contestant[2];
            var fetchedParty = contestant[3];
            var fetchedAge = contestant[4];
            var fetchedQualification = contestant[5];

            var contestantTemplate =
              "<div class='card' style='width: 15rem; margin: 1rem;'><img class='card-img-top'src='../img/Sample_User_Icon.png' alt=''><div class='card-body text-center'><h4 class='card-title'>" +
              name +
              "</h4>" +
              "<button type='button' class='btn btn-info' data-toggle='modal' data-target='#modal" +
              id +
              "'>Click Here to Vote</button>" +
              "<div class='modal fade' id='modal" +
              id +
              "' tabindex='-1' role='dialog' aria-labelledby='exampleModalCenterTitle' aria-hidden='true'>" +
              "<div class='modal-dialog modal-dialog-centered' role='document'>" +
              "<div class='modal-content'>" +
              "<div class='modal-header'>" +
              "<h5 class='modal-title' id='exampleModalLongTitle'> <b>" +
              name +
              "</b></h5>" +
              "<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>" +
              "</div>" +
              "<div class='modal-body'> <b> Party : " +
              fetchedParty +
              "<br>Age : " +
              fetchedAge +
              "<br>Qualification : " +
              fetchedQualification +
              "<br></b></div>" +
              "<div class='modal-footer'>" +
              "<button class='btn btn-info' onClick='App.castVote(" +
              id.toString() +
              ")'>VOTE</button>" +
              "<button type='button' class='btn btn-info' data-dismiss='modal'>Close</button></div>" +
              "</div></div></div>" +
              "</div></div>";
            contestantsResults.append(contestantTemplate);

            var contestantOption =
              "<option style='padding: auto;' value='" +
              id +
              "'>" +
              name +
              "</option>";
            contestantSelect.append(contestantOption);

            var contestantTemplateAdmin =
              "<tr><th>" +
              id +
              "</th><td>" +
              name +
              "</td><td>" +
              fetchedAge +
              "</td><td>" +
              fetchedParty +
              "</td><td>" +
              fetchedQualification +
              "</td><td>" +
              voteCount +
              "</td></tr>";
            contestantsResultsAdmin.append(contestantTemplateAdmin);
          });
        }
        loader.hide();
        content.show();
      })
      .catch(function (error) {
        console.warn(error);
      });

    // ------------- fetching current phase code -------------
    App.contracts.Contest.deployed()
      .then(function (instance) {
        return instance.state();
      })
      .then(function (state) {
        var fetchedState;
        var fetchedStateAdmin;
        phaseEnum = state.toString();
        if (state == 0) {
          fetchedState =
            "Registration phase is on , go register yourself to vote !!";
          fetchedStateAdmin = "Registration";
        } else if (state == 1) {
          fetchedState = "Voting is now live !!!";
          fetchedStateAdmin = "Voting";
        } else {
          fetchedState = "Voting is now over !!!";
          fetchedStateAdmin = "Election over";
        }

        var currentPhase = $("#currentPhase"); //for user
        currentPhase.empty();
        var currentPhaseAdmin = $("#currentPhaseAdmin"); //for admin
        currentPhaseAdmin.empty();
        var phaseTemplate = "<h1>" + fetchedState + "</h1>";
        var phaseTemplateAdmin =
          "<h3> Current Phase : " + fetchedStateAdmin + "</h3>";
        currentPhase.append(phaseTemplate);
        currentPhaseAdmin.append(phaseTemplateAdmin);
      })
      .catch(function (err) {
        console.error(err);
      });

    // ------------- showing result -------------
    App.contracts.Contest.deployed()
      .then(function (instance) {
        return instance.state();
      })
      .then(function (state) {
        var result = $("#Results");
        if (state == 2) {
          $("#not").hide();
          contestInstance.contestantsCount().then(function (contestantsCount) {
            for (var i = 1; i <= contestantsCount; i++) {
              contestInstance.contestants(i).then(function (contestant) {
                var id = contestant[0];
                var name = contestant[1];
                var voteCount = contestant[2];
                var fetchedParty = contestant[3];
                var fetchedAge = contestant[4];
                var fetchedQualification = contestant[5];

                var resultTemplate =
                  "<tr><th>" +
                  id +
                  "</th><td>" +
                  name +
                  "</td><td>" +
                  fetchedAge +
                  "</td><td>" +
                  fetchedParty +
                  "</td><td>" +
                  fetchedQualification +
                  "</td><td>" +
                  voteCount +
                  "</td></tr>";
                result.append(resultTemplate);
              });
            }
          });
        } else {
          $("#renderTable").hide();
        }
      })
      .catch(function (err) {
        console.error(err);
      });
  },

  // ------------- voting code -------------
  castVote: function (id) {
    console.log({ id });
    var contestantId = id;
    App.contracts.Contest.deployed()
      .then(function (instance) {
        return instance.vote(contestantId, { from: App.account });
      })
      .then(function (result) {
        // handle success
      })
      .catch(function (err) {
        console.error(err);
      });
  },

  // ------------- adding candidate code -------------
  addCandidate: function () {
    $("#loader").hide();
    var name = $("#name").val();
    var age = $("#age").val();
    var party = $("#party").val();
    var qualification = $("#qualification").val();

    App.contracts.Contest.deployed()
      .then(function (instance) {
        console.log({ instance });
        return instance.addContestant(name, party, age, qualification, {
          from: App.account,
        });
      })
      .then(function (result) {
        $("#loader").show();
        $("#name").val("");
        $("#age").val("");
        $("#party").val("");
        $("#qualification").val("");
      })
      .catch(function (err) {
        console.error(err);
      });
  },

  // ------------- changing phase code -------------

  changeState: function () {
    phaseEnum++;
    // console.log(phaseEnum);
    App.contracts.Contest.deployed()
      .then(function (instance) {
        return instance.changeState(phaseEnum, { from: App.account });
      })
      .then(function (result) {
        $("#content").hide();
        $("#loader").show();
      })
      .catch(function (err) {
        console.error(err);
      });
  },

  // ------------- registering voter code -------------
  registerVoter: function () {
    if (event) event.preventDefault();

    var add = $("#accadd").val().trim();

    if (!web3.isAddress(add)) {
      alert("Invalid address");
      return;
    }
    console.log("Network ID:", web3.version.network);

    App.contracts.Contest.deployed()
    .then(function (instance) {
      return instance.voterRegisteration(add, { from: App.account });
    })
    .then(function () {
      $("#content").hide();
      $("#loader").show();
    })
    .catch(function (err) {
      console.error("Registration failed:", err.message || err);
    });
  }

};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
