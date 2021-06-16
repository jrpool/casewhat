# caseWhat
Copies descriptions from Rally user stories to the test cases that belong to them.

## Installation

Navigate in your bash shell to the directory that this project’s directory will be a child of.

```bash
git clone https://github.com/jrpool/casewhat.git
cd casewhat
npm install
```

Create a file named `.env` in the project directory (a sibling of `index.js`).

Populate the `.env` file with this content, replacing the text after the `=` symbol with your credentials.

```
RALLY_USERNAME=your.rallyusername@yourdomain.tld
RALLY_PASSWORD=YourRallyPassword
```
Save the `.env` file.

## Usage

Determine a Rally test folder that contains all and only the test cases to be manipulated.

```bash
node index TFnnnn
```

This command will cause the contents of the Description fields of the test cases in test folder TFnnnn to be replaced by duplicates of the contents of the Description fields of the user stories that the test cases belong to.

## Support

Questions and bug reports may be directed to `jonathan.pool@cvshealth.com`.