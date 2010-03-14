.PHONY: clean update

acc.min.js: acc.js
	(head -n 37 "$<" && jsc --compilation_level \
			ADVANCED_OPTIMIZATIONS --js "$<" \
			) 1>"$@"

clean:
	rm -f acc.min.js

update: acc.min.js
	rsync -u --progress *.js /var/www/js

