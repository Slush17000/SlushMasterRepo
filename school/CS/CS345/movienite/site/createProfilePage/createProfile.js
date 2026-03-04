let keyval = new Keyval(KEYVAL_API_KEY);
let errorT;

function setup() {
  errorT = createP();
  errorT.position(windowWidth / 2 - 190, 325);
  errorT.style("font-size", "36px");

  // textboxes
  saveButton = createButton("Create Account");
  saveButton.position(windowWidth / 2 - 190, 250);
  saveButton.mousePressed(loader);
  firstNameBox = createInput("");
  firstNameBox.attribute("placeholder", "First Name");
  firstNameBox.position(windowWidth / 2 - 190, 125);
  lastNameBox = createInput("");
  lastNameBox.attribute("placeholder", "Last Name");
  lastNameBox.position(windowWidth / 2 - 190, 150);
  emailBox = createInput("");
  emailBox.attribute("placeholder", "Email");
  emailBox.position(windowWidth / 2 - 190, 175);
  passwordBox = createInput("");
  passwordBox.attribute("placeholder", "Password");
  passwordBox.position(windowWidth / 2 - 190, 200);

  let title = createP("MOVIENITE Profile Creation");
  title.position(windowWidth / 2 - 190, 25);
  title.style("color", textColor);
  title.style('font-family', Font);
  title.style("font-size", "36px");
  let subtitle1 = createP("Already have an account?");
  let subtitle2 = createP("<b>LOGIN</b>");
  subtitle1.position(windowWidth / 2 - 190, 275);
  subtitle1.style("color", textColor);
  subtitle1.style('font-family', Font);
  subtitle1.style("font-size", "24px");
  subtitle2.position(windowWidth / 2 - 190, 300);
  subtitle2.style("color", textColor);
  subtitle2.style("font-size", "24px");
  subtitle2.mousePressed(goToLoginPage);
}

function loader() {
  errorT.html("");
  errorT.style("color", "");
  errorT.style('font-family', Font);
  errorT.style("font-size", "36px");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    firstNameBox.value() == "" ||
    lastNameBox.value() == "" ||
    emailBox.value() == "" ||
    passwordBox.value() == "" ||
    !emailRegex.test(emailBox.value())
  ) {
    errorT.html("You must fill out all fields!");
    errorT.style("color", errorColor);
  } else {
    // Check if email is unique
    checkUnique(emailBox.value(), (isUnique) => {
      if (!isUnique) {
        errorT.html("Email is already in use!");
        errorT.style("color", "#FF0000");
      } else {
        // Continue with user creation logic
        errorT.html("Creation Success!");
        errorT.style("color", "#00FF00");

        const newUser = new User(
          emailBox.value(),
          firstNameBox.value(),
          lastNameBox.value(),
          passwordBox.value()
        );

        keyval.set(emailBox.value(), newUser.createJSONlayout(), (data) => {
          localStorage.setItem("user", emailBox.value());
          goToUserPage();
        });
      }
    });
  }
}

function draw() {
  //background(69, 0, 132);
}

function checkUnique(email, callback, keyval = new Keyval(KEYVAL_API_KEY)) {
  keyval.get(email, (data) => {
    if (data == "Resource Not Found") {
      callback(true);
    }
    else {
      callback(false);
    }
  });
}