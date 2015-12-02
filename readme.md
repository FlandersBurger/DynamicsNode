# Project description

Dynamics integration is a set of tools build on top of node.js that allows you to quickly create scripts to move data between Microsoft Dynamics CRM and other systems

# How to install

Create a new directory to store your scripts

```
$ mkdir MyScripts
```

Then cd into it
```
$ cd MyScripts
```

Install Dynamics Inegration
```
$  npm install dynamicsintegration
```
Create a new myscript.js file and start adding code

# How to use it

Edit the newly created file and add the following code

``` javascript

var CRMClient = new require("DynamicsIntegration").CRMClient;

var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso");

var who = crm.whoAmI();
var myUser = crm.retrieve("systemuser",who);
console.log(myUser);

var mybu = crm.retrieve("businessunit",{businessunitid:myUser.businessunitid});
console.log(mybu);
```

Replace the connection string with your CRM server values.

More information about the connection string options: https://msdn.microsoft.com/en-us/library/gg695810.aspx

Save the file and run the script.

In order to run the script use node
```
$ node myscript
```
# CRMClient methods
## Constructor
``` ts
constructor(private connectionString?: string)
```
The connection string could be either a valid connection string or a name of an existing connection string in the file "config.json" at the root path.

The config.json file must be a valid json file, with a property named connectionStrings, with the following format.

``` json
{
	"connectionStrings":
	{
    "default":"Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode",
    "connection2":"Url=http://crm.contoso.com/xrmContoso"
	}
}
```
If no value is passed to the constructor, the "default" text will be assumed, which means that a connection string named "default" will be used.

Example:
``` javascript
var crm = new CRMClient("Url=http://crm.contoso.com/xrmContoso; Domain=CONTOSO; Username=jsmith; Password=passcode");
```
Creates a connection using a valid Connection String

``` javascript
var crm = new CRMClient("connection2");
```
Creates a connection using the connection string named "connection2" specified in the config.json file

``` javascript
var crm = new CRMClient();
```
or

``` javascript
var crm = new CRMClient("default");
```
Creates a connection using the connection string named "default" specified in the config.json file


More information about the connection string options: https://msdn.microsoft.com/en-us/library/gg695810.aspx

## WhoAmI

Returns the GUID of the current user. Useful for testing the active connection.

Example:
``` javascript
var who = crm.whoAmI();
console.log(who);
```
outputs '6fefeb79-5447-e511-a5db-0050568a69e2'

## Retrieve
Retrieves a record given its Guid

Signature:
``` typescript
retrieve(entityName: string, id: string|Guid, columns?: string|string[]|boolean)
```
**entityName** is the name of the entity to be retrieved. The name is case insensitive, so all values are lowercased before send to CRM.

**id** can be either a string with the GUID if the record to be retrieved, or a Guid object with the same value.

**columns** can be either a column name, an array of column names, or a *true* value indicating that all columns must be retrieved. The default value is *true*. An ***** value has the same effect

Examples:
``` javascript
var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2");
console.log(account)
```
Returns all the columns for the specified account id. The last is equivalent to
``` javascript
var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2","*");
console.log(account)
```
or to
``` javascript
var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2",true);
console.log(account)
```
Also can use the Guid class to specify the *id* parameter. This allows to perform a GUID validation before calling the method.
``` javascript
var Guid = require("DynamicsIntegration").Guid;
var account = crm.retrieve("account",new Guid("6fefeb79-5447-e511-a5db-0050568a69e2"));
console.log(account)
```

``` javascript
var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2",["accountid","name","ownerid","createdon"]);
console.log(account)
```
Returns the *accountid,name,ownerid,createdon* columns for the given account id

``` javascript
var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2","name");
console.log(account.name)
```
Returns the *name* of the specified account.

The returned value is a javascript object containing the values of the record. If no data found, then a *null* object is returned.

The returned object will contain also the name and type for *Optionset* and *Lookup* fields.

``` javascript
var account = crm.retrieve("account","6fefeb79-5447-e511-a5db-0050568a69e2","ownerid");
console.log(account.ownerid); // outputs the GUID value
console.log(account.ownerid_type); // outputs systemuser
console.log(account.ownerid_name); // outputs John Doe
```
## Retrieve multiple
Retrieves one or more records of the specified entity that fulfill the specified conditions.

Signature:
``` typescript
retrieveMultiple(fetchXml: string): Array<any>;
retrieveMultiple(entityName: string, conditions?, attributes?:boolean|string|string[]): Array<any>
```
**fetchXml** is a *Fetch Xml* query to specify the records to be retrieved. More information in https://msdn.microsoft.com/en-us/library/gg328332.aspx

**enityName** in case you don't want to write an xml to specify the records to retrieve, can use second overload for this method. The only mandatory parameter for this overload is the *entityName* that specifies the entity to be retrieved. If the attributes parameter is missing, the all the existing records of the specified entity will be retrieved. Is equivalent to write a Fetch Xml without any filter conditions.

**conditions** is a Javascript object that must contain a property for every filter to be applied. More info in the next chapter.

**attributes** Same as in the retrieve method. Specifies the columns to be retrieved. Could be either a single column name or an array of columns names or a *true* value to indicate the all columns have to be retrieved. The last is the default value.

Returns an array ob objects, where each item contains the values of one record.

Examples:
``` javascript
var accounts = crm.retrieveMultiple("<fetch><entity name='account'></entity></fetch>");
```
Retrieves all the records of the account entity. Only the accountid column will be retrieved (the id column is always returned in all Crm queries)
``` javascript
var accounts = crm.retrieveMultiple("account");
```
Retrieves all the records of the **account** entity. Includes also ***all*** the columns of the entity.
``` javascript
var accounts = crm.retrieveMultiple("account",{name:"contoso"});
```
Retrieves all the records of the **account** entity where the account name is equals to "contoso". Returns ***all*** the columns of the entity.
``` javascript
var accounts = crm.retrieveMultiple("account",{name:"contoso"},["accountid","name","ownerid","createdon"]);
```
Retrieves the same as the previous one, but only the specified columns are included in the query.
``` javascript
var accounts = crm.retrieveMultiple("account",{name:["contoso","acme"]});
```
Retrieves all the records of the **account** entity where the account name is equals to "contoso" or "acme". Returns ***all*** the columns of the entity.

As in the retrieve method, each returned object will contain the name and type for *Optionset* and *Lookup* fields.

## Conditions syntax
There are two ways to specify when retrieving records from CRM. A Fetch Xml query, or a condition object.

A condition object is a Javascript where every property represents a condition.

For example:

``` javascript
var cond = {name:"myAccount"}
```
means: retrieve all records where the attribute *name* is equals to *"myAccount"*

You can also add more conditions
``` javascript
var cond = {name:"myAccount", createdon:new Date()}
```
means: retrieve all records where the attribute *name* is equals to *"myAccount"* and the attribute *createdon* is equal to the current date

If you want to specify other operators, use the following Syntax
``` javascript
var cond = {name:{$like:"contoso%"}, createdon:{$bt:new Date()}}
```
means: retrieve all records where the attribute *name* begins with *"contoso%"* and the attribute *createdon* is bigger than the current date

The currently supported operators are:
```
$eq, $neq, $gt, $ge,	$le, $lt, $like, $notlLike, $in, $notIn, $between, $notBetween
```
when the simple syntax is used ``` {name:value} ``` then the ```$eq``` operator is used.

If the value is an array, then the ```$in``` operator is used. For example: ``` {name:["contoso", "acme", "cycleworks"]} ``` means: where name is one of contoso, acme or cycleworks.

If the value is a null value, then the ```null```operator is applied. For example: ```{name:null}``` will retrieve all the records where the name is ```null```.

## Retrieve all
Is a simplified way of retrieving all the existing records of an entity.

Signature:
```typescript
retrieveAll(entityName: string): Array<any>
```
Is equivalent to call the retrieveMultimple method not specifying the conditions or attributes method


## Create
Creates a record with the specified values in CRM and returns the Guid of the record.

Signature:
``` typescript
create(entityName: string, attributes: any): string
```
**entityName** the name of the entity which record is being created

**attributes** javascript object with the values to apply to the new record.

Examples:
``` javascript
var accountid = crm.create("account",{name:"contoso",description:"this is a test",AccountCategoryCode:1});
console.log(accountid);
```
As always, the names in the entity or attributes are case insensitive, so all the names will be lowercased before send the operation to Crm.


## Update
Updates a record in CRM.
Signature:
``` typescript
update(entityName: string, attributes: any): void
```



## Upsert
TBC

## Delete
TBC

Deletes a Record in CRM.

Signature:
``` typescript
delete(entityName: string, id: string|Guid):void{
```


# Repl integration
TBC

# Commands
TBC

## Export
```
$ di export systemuser users.xml
```

## Import
```
$ di import users.xml
```


# How to run tests
Requires mocha to run the tests (https://mochajs.org/)

```
$  npm test
```
# Backlog
(Ordered by priority)

* Improve documentation
* Add DataTable functions
* Add different Crm versions support
* Improve integration tests
* Add test coverage reports
* Add SQL support
* Add import/expport commands
* Add functions to work with solutions
* Add support for missing operators in condition objects
