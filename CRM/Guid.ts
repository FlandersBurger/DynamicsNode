export class Guid {
    private static EMPTY = "00000000-0000-0000-0000-000000000000";
    private static validator = new RegExp("^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$", "i");
    private value: string;

    constructor(guid?: string) {
        if (guid === undefined) {
            this.value = Guid.EMPTY;
        }
        else {
            if (Guid.isGuid(guid)) {
                this.value = guid;
            }
            else {
                throw new Error("Invalid GUID value");
            }
        }
    }

    private static gen(count) {
        var out = "";
        for (var i = 0; i < count; i++) {
            out += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return out;
    }

    equals(other: Guid|string):boolean {
        // Comparing string `value` against provided `guid` will auto-call
        // toString on `guid` for comparison
        if(other instanceof Guid) return this.value == other.getValue();
        return Guid.isGuid(other) && this.value == other;
    };

    isEmpty():boolean {
        return this.value === Guid.EMPTY;
    };

    toString():string {
        return this.value;
    };

    toJSON():string {
        return this.value;
    };

    getValue():string {
        return this.value;
    }

    static isGuid(value: string | Guid):boolean {
        return value && (value instanceof Guid || Guid.validator.test(value.toString()));
    };

    static create():Guid {
        return new Guid([Guid.gen(2), Guid.gen(1), Guid.gen(1), Guid.gen(1), Guid.gen(3)].join("-"));
    };

    static raw():string {
        return [Guid.gen(2), Guid.gen(1), Guid.gen(1), Guid.gen(1), Guid.gen(3)].join("-");
    };

    static empty():Guid{
      return new Guid(Guid.EMPTY);
    }
}
